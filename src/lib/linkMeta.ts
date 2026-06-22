import type { LinkMeta } from '../types';

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function normaliseUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Fetch a link's title + thumbnail via the free, CORS-enabled microlink.io API.
 * Degrades gracefully to a plain URL/domain card on any failure or rate-limit.
 */
async function fetchScreenshot(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`,
    );
    if (!res.ok) return undefined;
    const json = (await res.json()) as {
      status?: string;
      data?: { screenshot?: { url?: string } };
    };
    if (json.status !== 'success') return undefined;
    return json.data?.screenshot?.url || undefined;
  } catch {
    return undefined;
  }
}

export async function fetchLinkMeta(rawUrl: string): Promise<LinkMeta> {
  const url = normaliseUrl(rawUrl);
  const base: LinkMeta = { url, domain: domainOf(url) };
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) return { ...base, thumbnailUrl: await fetchScreenshot(url) };
    const json = (await res.json()) as {
      status?: string;
      data?: { title?: string; image?: { url?: string }; logo?: { url?: string } };
    };
    if (json.status !== 'success' || !json.data) {
      return { ...base, thumbnailUrl: await fetchScreenshot(url) };
    }
    const thumbnailUrl =
      json.data.image?.url || json.data.logo?.url || (await fetchScreenshot(url));
    return {
      url,
      domain: base.domain,
      title: json.data.title || undefined,
      thumbnailUrl,
    };
  } catch {
    return { ...base, thumbnailUrl: await fetchScreenshot(url) };
  }
}
