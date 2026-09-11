/**
 * The crawler fetches attacker-supplied URLs, so the private-address guard is a
 * trust boundary. These cases lock in the addresses that must never be reachable.
 */
import dns from 'dns/promises';

jest.mock('dns/promises', () => ({ __esModule: true, default: { lookup: jest.fn() } }));
jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

import axios from 'axios';
import { fetchPage } from '../crawler/fetcher';

const mockedLookup = dns.lookup as unknown as jest.Mock;
const mockedGet = axios.get as unknown as jest.Mock;

const resolvesTo = (...addresses: string[]) =>
  mockedLookup.mockResolvedValue(addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })));

const htmlResponse = (body = '<html>ok</html>') => ({
  status: 200,
  headers: { 'content-type': 'text/html' },
  data: body
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedGet.mockResolvedValue(htmlResponse());
});

describe('SSRF guard', () => {
  const blocked = [
    ['loopback literal', 'http://127.0.0.1/admin', '127.0.0.1'],
    ['private 10/8', 'http://10.0.0.5/', '10.0.0.5'],
    ['private 192.168/16', 'http://192.168.1.1/', '192.168.1.1'],
    ['private 172.16/12', 'http://172.20.0.1/', '172.20.0.1'],
    ['cloud metadata', 'http://169.254.169.254/latest/meta-data/', '169.254.169.254'],
    ['carrier-grade NAT', 'http://100.64.0.1/', '100.64.0.1'],
    ['IPv6 loopback', 'http://[::1]/', '::1'],
    ['IPv6 unique-local', 'http://[fd00::1]/', 'fd00::1'],
    ['IPv4-mapped IPv6', 'http://[::ffff:127.0.0.1]/', '::ffff:127.0.0.1']
  ] as const;

  it.each(blocked)('rejects %s', async (_label, url) => {
    const result = await fetchPage(url);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/private or loopback/i);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('rejects a public hostname that resolves to a private address (DNS rebinding)', async () => {
    resolvesTo('10.0.0.7');
    const result = await fetchPage('https://totally-public.example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/private or loopback/i);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('rejects when ANY resolved address is private', async () => {
    resolvesTo('93.184.216.34', '127.0.0.1');
    const result = await fetchPage('https://mixed.example.com');
    expect(result.ok).toBe(false);
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('rejects a redirect that points into the private network', async () => {
    resolvesTo('93.184.216.34');
    mockedGet.mockResolvedValueOnce({
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      data: ''
    });

    const result = await fetchPage('https://public.example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/private or loopback/i);
  });

  it('rejects non-http protocols', async () => {
    const result = await fetchPage('file:///etc/passwd');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unsupported protocol/i);
  });

  it('allows a genuinely public host', async () => {
    resolvesTo('93.184.216.34');
    const result = await fetchPage('https://example.com');
    expect(result.ok).toBe(true);
    expect(result.html).toContain('ok');
  });

  it('follows a public redirect and re-validates it', async () => {
    resolvesTo('93.184.216.34');
    mockedGet
      .mockResolvedValueOnce({ status: 301, headers: { location: 'https://example.com/careers' }, data: '' })
      .mockResolvedValueOnce(htmlResponse('<html>careers</html>'));

    const result = await fetchPage('https://example.com');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://example.com/careers');
    // Both hops were checked, not just the first.
    expect(mockedLookup).toHaveBeenCalledTimes(2);
  });

  it('gives up rather than following a redirect loop forever', async () => {
    resolvesTo('93.184.216.34');
    mockedGet.mockResolvedValue({ status: 302, headers: { location: 'https://example.com/next' }, data: '' });

    const result = await fetchPage('https://example.com');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/too many redirects/i);
  });
});
