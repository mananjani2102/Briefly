import { describe, expect, it } from 'vitest'
import {
  allDataToJson,
  conversationToHtml,
  conversationToMarkdown,
  conversationToPlainText,
  messageText,
  safeFilename
} from '../src/lib/export'
import { DEFAULT_SETTINGS } from '../src/lib/settings'
import type { ConversationRow, MessageRow } from '../src/lib/db'

const conv: ConversationRow = {
  id: 'c1',
  title: 'USB hubs compared',
  model: 'claude-sonnet-5',
  pinned: 0,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
  webSearch: true,
  autoTitled: true
}

function msg(partial: Partial<MessageRow>): MessageRow {
  return {
    id: 'm',
    conversationId: 'c1',
    role: 'user',
    blocks: [],
    createdAt: 1700000000000,
    model: null,
    usage: null,
    stopReason: null,
    kind: 'chat',
    agentSteps: null,
    error: null,
    stopped: false,
    notice: null,
    contextTitle: null,
    contextUrl: null,
    ...partial
  }
}

describe('export', () => {
  it('renders a conversation as markdown with roles, models, and sources', () => {
    const md = conversationToMarkdown(conv, [
      msg({ role: 'user', blocks: [{ type: 'text', text: 'Which hub?' }], contextTitle: 'Wirecutter', contextUrl: 'https://w.com/a' }),
      msg({
        role: 'assistant',
        model: 'claude-sonnet-5',
        blocks: [
          {
            type: 'text',
            text: 'The Anker 555 is best.',
            citations: [{ type: 'web_search_result_location', url: 'https://w.com/a', title: 'Wirecutter review' }]
          }
        ]
      })
    ])
    expect(md).toContain('# USB hubs compared')
    expect(md).toContain('## You')
    expect(md).toContain('with page context: [Wirecutter](https://w.com/a)')
    expect(md).toContain('## Briefly · Sonnet 5')
    expect(md).toContain('The Anker 555 is best.')
    expect(md).toContain('1. [Wirecutter review](https://w.com/a)')
  })

  it('renders a conversation as plain text with clean formatting and citations', () => {
    const txt = conversationToPlainText(conv, [
      msg({ role: 'user', blocks: [{ type: 'text', text: 'Which hub?' }], contextTitle: 'Wirecutter', contextUrl: 'https://w.com/a' }),
      msg({
        role: 'assistant',
        model: 'claude-sonnet-5',
        kind: 'agent',
        agentSteps: [{ id: 's1', label: 'Read page', detail: 'Fetched DOM', icon: 'page', status: 'ok', imageThumb: null }],
        blocks: [{ type: 'text', text: 'Anker 555 is top.' }]
      })
    ])
    expect(txt).toContain('USB hubs compared')
    expect(txt).toContain('YOU')
    expect(txt).toContain('Page Context: Wirecutter (https://w.com/a)')
    expect(txt).toContain('BRIEFLY (Sonnet 5)')
    expect(txt).toContain('Agent Steps:')
    expect(txt).toContain('• Read page (Fetched DOM)')
    expect(txt).toContain('Anker 555 is top.')
  })

  it('renders a conversation as standalone styled HTML document', () => {
    const html = conversationToHtml(conv, [
      msg({ role: 'user', blocks: [{ type: 'text', text: 'Which hub?' }] }),
      msg({
        role: 'assistant',
        model: 'claude-sonnet-5',
        blocks: [
          {
            type: 'text',
            text: 'The Anker 555 is best.',
            citations: [{ type: 'web_search_result_location', url: 'https://w.com/a', title: 'Wirecutter review' }]
          }
        ]
      })
    ])
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>USB hubs compared · Briefly Export</title>')
    expect(html).toContain('class="message user"')
    expect(html).toContain('class="message assistant"')
    expect(html).toContain('The Anker 555 is best.')
    expect(html).toContain('href="https://w.com/a"')
  })

  it('notes attached images in message text', () => {
    const text = messageText(
      msg({
        blocks: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'x' } },
          { type: 'text', text: 'What is this?' }
        ]
      })
    )
    expect(text).toBe('*(image attached)*\n\nWhat is this?')
  })

  it('exports valid JSON without the api key', () => {
    const json = allDataToJson(
      [{ conversation: conv, messages: [msg({ blocks: [{ type: 'text', text: 'hi' }] })] }],
      { ...DEFAULT_SETTINGS, apiKey: 'sk-ant-secret' }
    )
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(parsed.app).toBe('briefly')
    expect(JSON.stringify(parsed)).not.toContain('sk-ant-secret')
    expect(Array.isArray(parsed.conversations)).toBe(true)
  })

  it('produces safe filenames', () => {
    expect(safeFilename('What about “C++” & <stuff>?', 'md')).toBe('What-about-C-stuff.md')
    expect(safeFilename('   ', 'json')).toBe('briefly-export.json')
  })
})
