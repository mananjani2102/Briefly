import { useEffect, useRef, useState } from 'react'
import Icon from '../../ui/Icon'
import MessageView from './MessageView'
import ContextChip from './ContextChip'
import QuickStart from './QuickStart'
import { useStore } from '../store'

export default function Thread() {
  const messages = useStore((s) => s.messages)
  const streaming = useStore((s) => s.streaming)
  const offline = useStore((s) => s.offline)
  const ref = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const isStreaming = streaming !== null

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (nearBottom.current) {
      // Keep pinned to bottom during streaming or new messages
      el.scrollTop = el.scrollHeight
    }
  }, [messages, streaming])

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isNear = distanceToBottom < 100
    nearBottom.current = isNear
    setShowJump(distanceToBottom > 160)
  }

  const scrollToBottom = (smooth = true) => {
    const el = ref.current
    if (!el) return
    nearBottom.current = true
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
    setShowJump(false)
  }

  const lastUserIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') return i
    }
    return -1
  })()

  return (
    <div className="thread-wrap">
      <ContextChip />
      <div className="thread" ref={ref} onScroll={onScroll}>
        {offline && (
          <div className="banner">
            <Icon name="warning" size={14} />
            You're offline — answers need a connection.
          </div>
        )}
        {messages.length === 0 ? (
          <QuickStart />
        ) : (
          messages.map((m, i) => (
            <MessageView
              key={m.id}
              msg={m}
              isLast={i === messages.length - 1}
              isLastUser={i === lastUserIdx}
              streamingThis={streaming?.messageId === m.id}
            />
          ))
        )}
      </div>
      {showJump && (
        <button
          className={`jump ${isStreaming ? 'jump-active' : ''}`}
          onClick={() => scrollToBottom(true)}
          aria-label="Scroll to newest messages"
        >
          {isStreaming ? (
            <span className="jump-pulse" aria-hidden="true" />
          ) : (
            <Icon name="chevron-down" size={14} />
          )}
          <span>{isStreaming ? 'Generating below…' : 'Latest'}</span>
        </button>
      )}
    </div>
  )
}
