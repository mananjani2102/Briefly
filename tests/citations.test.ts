import { describe, expect, it } from 'vitest'
import {
  buildSegments,
  collectSources,
  formatSourceTitle,
  hostOf,
  sanitizeCitationUrl,
  sourceNumber
} from '../src/lib/citations'
import type { AnyBlock } from '../src/lib/anthropic/types'

describe('citations', () => {
  describe('sanitizeCitationUrl', () => {
    it('accepts valid https URLs and strips tracking query parameters', () => {
      const dirty = 'https://example.com/guide?utm_source=twitter&utm_medium=social&page=2'
      const clean = sanitizeCitationUrl(dirty)
      expect(clean).toBe('https://example.com/guide?page=2')
    })

    it('rejects dangerous protocols like javascript: or data:', () => {
      expect(sanitizeCitationUrl('javascript:alert(1)')).toBeNull()
      expect(sanitizeCitationUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
      expect(sanitizeCitationUrl('file:///etc/passwd')).toBeNull()
    })

    it('handles empty or malformed input safely', () => {
      expect(sanitizeCitationUrl('')).toBeNull()
      expect(sanitizeCitationUrl('not a url')).toBeNull()
    })
  })

  describe('formatSourceTitle', () => {
    it('strips redundant site name suffixes', () => {
      expect(formatSourceTitle('Artificial Intelligence - Wikipedia', 'https://en.wikipedia.org/wiki/AI')).toBe(
        'Artificial Intelligence'
      )
      expect(formatSourceTitle('Best Noise Cancelling Headphones | Wirecutter', 'https://nytimes.com')).toBe(
        'Best Noise Cancelling Headphones'
      )
    })

    it('falls back to hostname when title is missing', () => {
      expect(formatSourceTitle('', 'https://www.github.com/mananjani2102')).toBe('github.com')
    })
  })

  describe('buildSegments and collectSources', () => {
    it('builds text segments when citations exist', () => {
      const blocks: AnyBlock[] = [
        {
          type: 'text',
          text: 'First paragraph.',
          citations: [{ type: 'web_search_result_location', url: 'https://example.com', title: 'Ex' }]
        }
      ]
      const segments = buildSegments(blocks)
      expect(segments).toHaveLength(1)
      expect(segments[0].text).toBe('First paragraph.')
      expect(segments[0].citations).toHaveLength(1)
    })

    it('deduplicates sources and cleans URLs', () => {
      const blocks: AnyBlock[] = [
        {
          type: 'text',
          text: 'Here is information.',
          citations: [
            { type: 'web_search_result_location', url: 'https://docs.anthropic.com?utm_source=web', title: 'Claude Docs' },
            { type: 'web_search_result_location', url: 'https://docs.anthropic.com', title: 'Claude Docs duplicate' }
          ]
        }
      ]
      const sources = collectSources(blocks)
      expect(sources).toHaveLength(1)
      expect(sources[0].url).toBe('https://docs.anthropic.com/')
      expect(sourceNumber(sources, 'https://docs.anthropic.com')).toBe(1)
    })

    it('returns null for unknown URLs', () => {
      expect(sourceNumber([], 'https://unknown.com')).toBeNull()
      expect(sourceNumber([], undefined)).toBeNull()
    })
  })

  describe('hostOf', () => {
    it('strips www prefix', () => {
      expect(hostOf('https://www.theverge.com/tech')).toBe('theverge.com')
    })

    it('handles root domains', () => {
      expect(hostOf('https://anthropic.com')).toBe('anthropic.com')
    })
  })
})
