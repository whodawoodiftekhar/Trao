import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return isoString;
  }
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

/**
 * Strips raw markdown headers (###), bold/italic asterisks (**), backticks,
 * bullets, and special character tokens. If the resulting text has no alphanumeric
 * characters (e.g. was just '###' or '***'), returns the provided fallback.
 */
export function cleanText(text?: string, fallback: string = ''): string {
  if (!text) return fallback;

  const cleaned = text
    .replace(/^#+\s*/gm, '') // Remove markdown heading hashes at line starts (### Header)
    .replace(/(^|\s)#+(\s|$)/g, '$1$2') // Remove standalone hashes (###)
    .replace(/#+/g, '') // Strip any remaining hash characters
    .replace(/\*+/g, '') // Strip bold/italic asterisks
    .replace(/`+/g, '')
    .replace(/^[-–—•*+\d.]+\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();


  if (!/[a-zA-Z0-9]/.test(cleaned)) {
    return fallback;
  }

  return cleaned;
}

export function cleanRoleTitle(title?: string, fallback: string = 'Target Role'): string {
  return cleanText(title, fallback);
}


export function formatQuestionId(id?: string): string {
  if (!id) return '';
  const trimmed = id.trim();
  const match = trimmed.match(/^q(\d+)$/i);
  if (match) return `Q${match[1]}.`;
  if (/^q/i.test(trimmed)) {
    const rest = trimmed.slice(1).replace(/^[.-]/, '');
    return `Q${rest ? `${rest}.` : '.'}`;
  }
  return trimmed.endsWith('.') ? trimmed.toUpperCase() : `${trimmed.toUpperCase()}.`;
}

/**
 * Formats requirement ID into uppercase:
 * e.g., "r1" -> "R1", "r2" -> "R2"
 */
export function formatRequirementId(id?: string): string {
  if (!id) return '';
  return id.trim().toUpperCase();
}

/**
 * Turns an unknown thrown value into a message suitable for the UI.
 * A 401 means the session lapsed, which is fixable by signing in again —
 * don't report it as a missing kit.
 */
export function errorMessage(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 404) return 'Prep kit not found. It may have been deleted.';
  const message = (err as { message?: string })?.message;
  return message || 'Prep kit not found.';
}
