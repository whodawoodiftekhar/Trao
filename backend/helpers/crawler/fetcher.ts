import axios from 'axios';
import { URL } from 'url';
import dns from 'dns/promises';
import net from 'net';
import { config } from '../../Config/env';

export interface FetchResult {
  ok: boolean;
  url: string;
  html: string;
  status?: number;
  error?: string;
}

const MAX_REDIRECTS = 3;

/**
 * True for any address that can reach the host or its private network.
 * Checked against resolved IPs rather than the hostname, because a public
 * name can resolve to 127.0.0.1 or a cloud metadata address.
 */
function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 0) return true;                              // "this network"
    if (p[0] === 10) return true;                             // private
    if (p[0] === 127) return true;                            // loopback
    if (p[0] === 169 && p[1] === 254) return true;            // link-local + cloud metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // private
    if (p[0] === 192 && p[1] === 168) return true;            // private
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // carrier-grade NAT
    if (p[0] >= 224) return true;                             // multicast + reserved
    return false;
  }

  if (net.isIPv6(ip)) {
    const v6 = ip.toLowerCase().split('%')[0];
    if (v6 === '::1' || v6 === '::') return true;
    // IPv4-mapped addresses must be judged on the embedded IPv4. Node's URL
    // parser rewrites "::ffff:127.0.0.1" to the hex form "::ffff:7f00:1", so
    // both notations have to be recognised.
    const dotted = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (dotted) return isBlockedIp(dotted[1]);
    const hex = v6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const high = parseInt(hex[1], 16);
      const low = parseInt(hex[2], 16);
      return isBlockedIp(`${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`);
    }
    if (v6.startsWith('fe80')) return true;                   // link-local
    if (/^f[cd]/.test(v6)) return true;                       // unique-local
    return false;
  }

  return true; // unparseable — deny
}

/** Resolves the hostname and rejects if ANY answer points somewhere private. */
async function assertPublicHost(rawHostname: string): Promise<string | null> {
  if (config.allowLocalUrls) return null;

  // URL.hostname keeps the brackets on IPv6 literals ("[::1]"); strip them or
  // net.isIP fails and the address slips through to a DNS lookup.
  const hostname = rawHostname.replace(/^\[|\]$/g, '');

  if (net.isIP(hostname)) {
    return isBlockedIp(hostname) ? 'Access to private or loopback address rejected' : null;
  }

  let addresses: string[];
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map((a) => a.address);
  } catch {
    return 'Host could not be resolved';
  }

  if (addresses.length === 0) return 'Host could not be resolved';
  if (addresses.some(isBlockedIp)) {
    return 'Access to private or loopback address rejected';
  }
  return null;
}

export async function fetchPage(targetUrl: string, timeoutMs: number = 8000): Promise<FetchResult> {
  let currentUrl = targetUrl.trim();
  const scheme = currentUrl.match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase();
  if (!scheme) {
    // Bare domain like "acme.com" — assume https.
    currentUrl = 'https://' + currentUrl;
  } else if (scheme !== 'http' && scheme !== 'https') {
    // Prefixing https:// here would turn "file:///etc/passwd" into a URL that
    // parses as host "file" and sails past the protocol check.
    return { ok: false, url: currentUrl, html: '', error: 'Unsupported protocol: ' + scheme + ':' };
  }

  try {
    // Redirects are followed by hand so every hop is re-validated; letting axios
    // follow them would allow a public URL to bounce into the private network.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = new URL(currentUrl);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { ok: false, url: currentUrl, html: '', error: 'Unsupported protocol: ' + parsed.protocol };
      }

      const blocked = await assertPublicHost(parsed.hostname);
      if (blocked) {
        return { ok: false, url: currentUrl, html: '', error: blocked };
      }

      const response = await axios.get(currentUrl, {
        signal: AbortSignal.timeout(timeoutMs),
        timeout: timeoutMs,
        maxContentLength: 1024 * 1024,
        maxRedirects: 0,
        headers: {
          'User-Agent': 'Trao-Assessment-Bot/1.0 (Interview Research Pipeline)',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9'
        },
        validateStatus: (status) => status >= 200 && status < 400
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers['location'];
        if (!location) {
          return { ok: false, url: currentUrl, html: '', error: `HTTP ${response.status} without a redirect target` };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const contentType = String(response.headers['content-type'] || '');
      if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
        return { ok: false, url: currentUrl, html: '', error: `Ignored unsupported content-type: ${contentType}` };
      }

      return {
        ok: true,
        url: currentUrl,
        html: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        status: response.status
      };
    }

    return { ok: false, url: currentUrl, html: '', error: 'Too many redirects' };
  } catch (err: any) {
    const errorMsg = err.response?.status
      ? `HTTP ${err.response.status} (${err.response.statusText || 'Error'})`
      : err.code === 'ECONNABORTED'
      ? 'Connection timed out'
      : err.message || 'Network request failed';

    return { ok: false, url: currentUrl, html: '', status: err.response?.status, error: errorMsg };
  }
}
