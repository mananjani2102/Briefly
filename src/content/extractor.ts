import { Readability } from '@mozilla/readability'
import type { ExtractResponse } from '../lib/messages'

const MAX_CHARS = 24000

export function extractPage(): ExtractResponse {
  const url = location.href
  const fallbackTitle = document.title
  const selection = String(window.getSelection() ?? '').trim().slice(0, 8000)
  try {
    const clone = document.cloneNode(true) as Document
    const article = new Readability(clone, { charThreshold: 250 }).parse()
    let text = (article?.textContent ?? '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    if (text.length < 200) {
      const bodyText = (document.body?.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim()
      if (bodyText.length > text.length) text = bodyText
    }
    const truncated = text.length > MAX_CHARS
    if (truncated) text = text.slice(0, MAX_CHARS)
    if (!text && !selection) {
      return { ok: false, reason: 'empty', url, title: fallbackTitle, selection }
    }

    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0
    const readingTimeMinutes = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 220)) : 1

    const metaDesc =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      null

    const metaSite =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
      article?.siteName ||
      null

    return {
      ok: true,
      url,
      title: article?.title || fallbackTitle || url,
      siteName: metaSite,
      byline: article?.byline ?? null,
      text,
      excerpt: article?.excerpt ?? null,
      selection,
      truncated,
      wordCount,
      description: metaDesc,
      readingTimeMinutes
    }
  } catch {
    return { ok: false, reason: 'error', url, title: fallbackTitle, selection }
  }
}
