import { describe, expect, it } from 'vitest'
import {
  formatDollars,
  formatPercent,
  formatTokens,
  requestCostDollars,
  summarizeCost
} from '../src/lib/cost'
import type { Usage } from '../src/lib/anthropic/types'

describe('cost utility', () => {
  it('computes request cost for Haiku model with cache read discount', () => {
    const usage: Usage = {
      input_tokens: 1000,
      output_tokens: 500,
      cache_read_input_tokens: 5000,
      cache_creation_input_tokens: 0
    }
    const cost = requestCostDollars('claude-haiku-4-5', usage)
    expect(cost).toBeGreaterThan(0)
    expect(cost).toBeLessThan(0.01)
  })

  it('summarizes costs and generates breakdown per model', () => {
    const items = [
      {
        model: 'claude-haiku-4-5',
        usage: {
          input_tokens: 10000,
          output_tokens: 2000,
          cache_read_input_tokens: 40000,
          cache_creation_input_tokens: 0
        }
      },
      {
        model: 'claude-sonnet-5',
        usage: {
          input_tokens: 5000,
          output_tokens: 1000,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 5000
        }
      }
    ]

    const summary = summarizeCost(items)
    expect(summary.requestCount).toBe(2)
    expect(summary.dollars).toBeGreaterThan(0)
    expect(summary.cacheSavingsDollars).toBeGreaterThan(0)
    expect(summary.cacheHitRatio).toBeGreaterThan(0)
    expect(summary.breakdown['claude-haiku-4-5']).toBeDefined()
    expect(summary.breakdown['claude-sonnet-5']).toBeDefined()
    expect(summary.breakdown['claude-haiku-4-5'].label).toBe('Haiku 4.5')
  })

  it('formats tokens, dollars, and percentages cleanly', () => {
    expect(formatTokens(450)).toBe('450')
    expect(formatTokens(2400)).toBe('2.4K')
    expect(formatTokens(150000)).toBe('150K')
    expect(formatTokens(2500000)).toBe('2.5M')

    expect(formatDollars(0)).toBe('$0.00')
    expect(formatDollars(0.002)).toBe('< $0.01')
    expect(formatDollars(1.234)).toBe('$1.23')

    expect(formatPercent(0.456)).toBe('46%')
    expect(formatPercent(0)).toBe('0%')
  })
})
