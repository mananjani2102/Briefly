import { MODELS, isModelId } from './models'
import type { Usage } from './anthropic/types'

export function requestCostDollars(
  model: string,
  usage: Pick<Usage, 'input_tokens' | 'output_tokens' | 'cache_creation_input_tokens' | 'cache_read_input_tokens'>,
  now: Date = new Date()
): number {
  if (!isModelId(model)) return 0
  const info = MODELS[model]
  const sonnetPromoEnded = model === 'claude-sonnet-5' && now.getTime() >= Date.UTC(2026, 8, 1)
  const inputRate = sonnetPromoEnded ? 3 : info.pricePerMTokIn
  const outputRate = sonnetPromoEnded ? 15 : info.pricePerMTokOut
  const input = usage.input_tokens ?? 0
  const cacheRead = usage.cache_read_input_tokens ?? 0
  const cacheWrite = usage.cache_creation_input_tokens ?? 0
  const output = usage.output_tokens ?? 0
  return (
    ((input + cacheWrite * 1.25 + cacheRead * 0.1) / 1_000_000) * inputRate +
    (output / 1_000_000) * outputRate
  )
}

export interface ModelCostBreakdown {
  model: string
  label: string
  dollars: number
  inputTokens: number
  outputTokens: number
  requestCount: number
}

export interface CostSummary {
  dollars: number
  inputTokens: number
  outputTokens: number
  uncachedInputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  estimatedPreflightTokens: number
  requestCount: number
  retryCount: number
  breakdown: Record<string, ModelCostBreakdown>
  cacheHitRatio: number
  cacheSavingsDollars: number
}

export function summarizeCost(items: { model: string | null; usage: Usage | null }[]): CostSummary {
  let dollars = 0
  let inputTokens = 0
  let outputTokens = 0
  let uncachedInputTokens = 0
  let cacheCreationInputTokens = 0
  let cacheReadInputTokens = 0
  let estimatedPreflightTokens = 0
  let requestCount = 0
  let retryCount = 0
  let cacheSavingsDollars = 0
  const breakdown: Record<string, ModelCostBreakdown> = {}

  for (const item of items) {
    if (!item.usage || !item.model || !isModelId(item.model)) continue
    const modelId = item.model
    const modelInfo = MODELS[modelId]
    const input = item.usage.input_tokens ?? 0
    const cacheRead = item.usage.cache_read_input_tokens ?? 0
    const cacheWrite = item.usage.cache_creation_input_tokens ?? 0
    const output = item.usage.output_tokens ?? 0

    uncachedInputTokens += input
    cacheCreationInputTokens += cacheWrite
    cacheReadInputTokens += cacheRead
    inputTokens += input + cacheRead + cacheWrite
    outputTokens += output

    let itemCost = 0
    if (item.usage.requests && item.usage.requests.length > 0) {
      for (const request of item.usage.requests) {
        estimatedPreflightTokens += request.estimatedInputTokens
        requestCount += 1
        retryCount += request.retryCount
        itemCost += request.costDollars
      }
    } else {
      itemCost = requestCostDollars(modelId, item.usage)
      requestCount += 1
    }
    dollars += itemCost

    // Cache savings = cost if cacheRead tokens had been charged at full input rate vs 10% rate
    if (cacheRead > 0) {
      const savedInputRate = modelInfo.pricePerMTokIn * 0.9
      cacheSavingsDollars += (cacheRead / 1_000_000) * savedInputRate
    }

    if (!breakdown[modelId]) {
      breakdown[modelId] = {
        model: modelId,
        label: modelInfo.label,
        dollars: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0
      }
    }
    const b = breakdown[modelId]
    b.dollars += itemCost
    b.inputTokens += input + cacheRead + cacheWrite
    b.outputTokens += output
    b.requestCount += 1
  }

  const totalInputTokens = uncachedInputTokens + cacheReadInputTokens + cacheCreationInputTokens
  const cacheHitRatio = totalInputTokens > 0 ? cacheReadInputTokens / totalInputTokens : 0

  return {
    dollars,
    inputTokens,
    outputTokens,
    uncachedInputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    estimatedPreflightTokens,
    requestCount,
    retryCount,
    breakdown,
    cacheHitRatio,
    cacheSavingsDollars
  }
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function formatTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

export function formatDollars(d: number): string {
  if (d === 0) return '$0.00'
  if (d < 0.01) return '< $0.01'
  return `$${d.toFixed(2)}`
}
