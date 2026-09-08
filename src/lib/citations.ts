import { isTextBlock, type AnyBlock, type TextCitation } from './anthropic/types'

export interface Segment {
  text: string
  citations: TextCitation[]
}

export interface Source {
  url: string
  title: string
}

export function buildSegments(blocks: AnyBlock[]): Segment[] {
  const textBlocks = blocks.filter(isTextBlock)
  const anyCitations = textBlocks.some((b) => Array.isArray(b.citations) && b.citations.length > 0)
  if (!anyCitations) {
    const text = textBlocks.map((b) => b.text).join('')
    return text ? [{ text, citations: [] }] : []
  }
  return textBlocks
    .filter((b) => b.text.length > 0)
    .map((b) => ({
      text: b.text,
      citations: Array.isArray(b.citations) ? (b.citations as TextCitation[]) : []
    }))
}

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_src',
  'fbclid',
  'gclid',
  'msclkid',
  '_hsenc',
  '_hsmi',
  'mc_cid',
  'mc_eid'
])

export function sanitizeCitationUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null
  const trimmed = rawUrl.trim()
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        parsed.searchParams.delete(key)
      }
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export function formatSourceTitle(title: string | null | undefined, url: string): string {
  if (title && title.trim()) {
    return title.trim().replace(/\s+[-|·•]\s+[^|·•-]+$/, '').trim() || title.trim()
  }
  return hostOf(url)
}

export function collectSources(blocks: AnyBlock[]): Source[] {
  const sources: Source[] = []
  const seen = new Set<string>()
  for (const block of blocks) {
    if (!isTextBlock(block) || !Array.isArray(block.citations)) continue
    for (const c of block.citations as TextCitation[]) {
      const rawUrl = typeof c.url === 'string' ? c.url : null
      if (!rawUrl) continue
      const cleanUrl = sanitizeCitationUrl(rawUrl)
      if (!cleanUrl || seen.has(cleanUrl)) continue
      seen.add(cleanUrl)
      const rawTitle = typeof c.title === 'string' ? c.title : null
      sources.push({ url: cleanUrl, title: formatSourceTitle(rawTitle, cleanUrl) })
    }
  }
  return sources
}

export function sourceNumber(sources: Source[], url: string | undefined): number | null {
  if (!url) return null
  const clean = sanitizeCitationUrl(url) ?? url
  const idx = sources.findIndex((s) => s.url === clean || s.url === url)
  return idx === -1 ? null : idx + 1
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

