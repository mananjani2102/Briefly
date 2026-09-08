import { isModelId, MODELS } from './models'
import { isImageBlock, isTextBlock, type TextCitation } from './anthropic/types'
import type { ConversationRow, MessageRow } from './db'
import type { Settings } from './settings'

function modelLabel(model: string | null): string {
  return model && isModelId(model) ? MODELS[model].label : 'Briefly'
}

function citationsOf(msg: MessageRow): TextCitation[] {
  const out: TextCitation[] = []
  const seen = new Set<string>()
  for (const block of msg.blocks) {
    if (!isTextBlock(block) || !Array.isArray(block.citations)) continue
    for (const c of block.citations as TextCitation[]) {
      const url = typeof c.url === 'string' ? c.url : null
      if (!url || seen.has(url)) continue
      seen.add(url)
      out.push(c)
    }
  }
  return out
}

export function messageText(msg: MessageRow): string {
  const parts: string[] = []
  let imageCount = 0
  for (const block of msg.blocks) {
    if (isTextBlock(block)) {
      const text = block.text.trim()
      if (text) parts.push(text)
    } else if (isImageBlock(block)) {
      imageCount += 1
    }
  }
  if (imageCount > 0) parts.unshift(imageCount === 1 ? '*(image attached)*' : `*(${imageCount} images attached)*`)
  return parts.join('\n\n')
}

export function conversationToMarkdown(conv: ConversationRow, messages: MessageRow[]): string {
  const lines: string[] = [`# ${conv.title || 'Untitled conversation'}`, '']
  lines.push(`*Exported from Briefly · ${new Date(conv.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}*`)
  for (const msg of messages) {
    lines.push('')
    if (msg.role === 'user') {
      lines.push('## You', '')
      if (msg.contextTitle && msg.contextUrl) {
        lines.push(`*(with page context: [${msg.contextTitle}](${msg.contextUrl}))*`, '')
      }
      lines.push(messageText(msg))
    } else {
      lines.push(`## Briefly · ${modelLabel(msg.model)}`, '')
      if (msg.kind === 'agent' && msg.agentSteps && msg.agentSteps.length > 0) {
        for (const step of msg.agentSteps) {
          lines.push(`- ${step.label}${step.detail ? ` — ${step.detail}` : ''}`)
        }
        lines.push('')
      }
      lines.push(messageText(msg))
      const cites = citationsOf(msg)
      if (cites.length > 0) {
        lines.push('', '**Sources**', '')
        cites.forEach((c, i) => {
          lines.push(`${i + 1}. [${c.title || c.url}](${c.url})`)
        })
      }
    }
  }
  lines.push('')
  return lines.join('\n')
}

export function conversationToPlainText(conv: ConversationRow, messages: MessageRow[]): string {
  const divider = '='.repeat(60)
  const thinDivider = '-'.repeat(60)
  const lines: string[] = [
    conv.title || 'Untitled conversation',
    `Exported from Briefly · ${new Date(conv.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`,
    divider,
    ''
  ]

  for (const msg of messages) {
    if (msg.role === 'user') {
      lines.push('YOU')
      if (msg.contextTitle && msg.contextUrl) {
        lines.push(`Page Context: ${msg.contextTitle} (${msg.contextUrl})`)
      }
      lines.push(thinDivider)
      lines.push(messageText(msg).replace(/\*\(image attached\)\*/g, '[Image Attached]'))
      lines.push('')
    } else {
      lines.push(`BRIEFLY (${modelLabel(msg.model)})`)
      lines.push(thinDivider)
      if (msg.kind === 'agent' && msg.agentSteps && msg.agentSteps.length > 0) {
        lines.push('Agent Steps:')
        for (const step of msg.agentSteps) {
          lines.push(`  • ${step.label}${step.detail ? ` (${step.detail})` : ''}`)
        }
        lines.push('')
      }
      lines.push(messageText(msg))
      const cites = citationsOf(msg)
      if (cites.length > 0) {
        lines.push('', 'Sources:')
        cites.forEach((c, i) => {
          lines.push(`  [${i + 1}] ${c.title || c.url}: ${c.url}`)
        })
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function conversationToHtml(conv: ConversationRow, messages: MessageRow[]): string {
  const title = escapeHtml(conv.title || 'Untitled conversation')
  const dateStr = new Date(conv.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })

  const messageHtmls = messages.map((msg) => {
    const isUser = msg.role === 'user'
    const roleLabel = isUser ? 'You' : `Briefly · ${escapeHtml(modelLabel(msg.model))}`
    const rawText = messageText(msg)
    const contentHtml = escapeHtml(rawText).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')

    let extraHtml = ''
    if (isUser && msg.contextTitle && msg.contextUrl) {
      extraHtml += `<div class="context-banner">Page Context: <a href="${escapeHtml(msg.contextUrl)}" target="_blank" rel="noreferrer">${escapeHtml(msg.contextTitle)}</a></div>`
    }

    if (!isUser && msg.kind === 'agent' && msg.agentSteps && msg.agentSteps.length > 0) {
      extraHtml += '<ul class="agent-steps">'
      for (const step of msg.agentSteps) {
        extraHtml += `<li><strong>${escapeHtml(step.label)}</strong>${step.detail ? ` — <span>${escapeHtml(step.detail)}</span>` : ''}</li>`
      }
      extraHtml += '</ul>'
    }

    const cites = !isUser ? citationsOf(msg) : []
    let sourcesHtml = ''
    if (cites.length > 0) {
      sourcesHtml = '<div class="sources"><h4>Sources</h4><ol>'
      for (const c of cites) {
        const u = c.url || '#'
        sourcesHtml += `<li><a href="${escapeHtml(u)}" target="_blank" rel="noreferrer">${escapeHtml(c.title || u)}</a></li>`
      }
      sourcesHtml += '</ol></div>'
    }

    return `
      <article class="message ${isUser ? 'user' : 'assistant'}">
        <header class="message-header">
          <span class="role-badge">${roleLabel}</span>
          <time class="message-time">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
        </header>
        ${extraHtml}
        <div class="message-body"><p>${contentHtml}</p></div>
        ${sourcesHtml}
      </article>
    `
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} · Briefly Export</title>
  <style>
    :root {
      --bg: #F8F2E5;
      --surface: #FFFFFF;
      --ink: #201410;
      --ink-dim: #705850;
      --accent: #C2481A;
      --accent-soft: #FDEEE9;
      --border: #E8DCCB;
      --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Consolas, monospace;
    }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font-body);
      line-height: 1.6;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 780px;
      width: 100%;
    }
    header.chat-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--border);
    }
    h1 {
      font-size: 28px;
      margin: 0 0 8px 0;
      color: var(--ink);
    }
    .meta {
      color: var(--ink-dim);
      font-size: 14px;
    }
    .message {
      background: var(--surface);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }
    .message.user {
      background: var(--accent-soft);
      border-color: #F8D5C8;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .role-badge {
      font-weight: 600;
      font-size: 13px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .message.user .role-badge {
      color: #923410;
    }
    .message-time {
      font-size: 12px;
      color: var(--ink-dim);
    }
    .context-banner {
      font-size: 13px;
      color: var(--ink-dim);
      margin-bottom: 12px;
      padding: 6px 12px;
      background: rgba(255,255,255,0.6);
      border-radius: 6px;
    }
    .agent-steps {
      font-size: 13px;
      margin: 0 0 16px 0;
      padding-left: 20px;
      color: var(--ink-dim);
    }
    .message-body {
      font-size: 15px;
      word-break: break-word;
    }
    .message-body p {
      margin: 0 0 12px 0;
    }
    .message-body p:last-child {
      margin-bottom: 0;
    }
    .sources {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--border);
      font-size: 13px;
    }
    .sources h4 {
      margin: 0 0 6px 0;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--ink-dim);
    }
    .sources ol {
      margin: 0;
      padding-left: 20px;
    }
    a {
      color: var(--accent);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      font-size: 12px;
      color: var(--ink-dim);
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="chat-header">
      <h1>${title}</h1>
      <div class="meta">Exported from Briefly · ${dateStr}</div>
    </header>
    <main>
      ${messageHtmls}
    </main>
    <footer>Generated with Briefly AI</footer>
  </div>
</body>
</html>`
}

export function allDataToJson(
  data: { conversation: ConversationRow; messages: MessageRow[] }[],
  settings: Settings
): string {
  const { apiKey: _key, ...safeSettings } = settings
  return JSON.stringify(
    {
      app: 'briefly',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: safeSettings,
      conversations: data.map((d) => ({ ...d.conversation, messages: d.messages }))
    },
    null,
    2
  )
}

export function safeFilename(title: string, ext: string): string {
  const base = title.trim().replace(/[^\w\d -]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'briefly-export'
  return `${base}.${ext}`
}

export function downloadFile(name: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

