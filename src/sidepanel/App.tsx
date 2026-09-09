import { useEffect } from 'react'
import Header from './components/Header'
import Thread from './components/Thread'
import Composer from './components/Composer'
import NoKey from './components/NoKey'
import History from './views/History'
import Dialog from '../ui/Dialog'
import { stopAgent, useAgent } from './agent'
import { useStore } from './store'

export default function App() {
  const ready = useStore((s) => s.ready)
  const settings = useStore((s) => s.settings)
  const view = useStore((s) => s.view)
  const keyInvalid = useStore((s) => s.keyInvalid)
  const shortcutsOpen = useStore((s) => s.shortcutsOpen)
  const setShortcutsOpen = useStore((s) => s.setShortcutsOpen)

  useEffect(() => {
    void useStore.getState().init()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (e.key === 'Escape') {
        if (useStore.getState().shortcutsOpen) {
          useStore.getState().setShortcutsOpen(false)
          return
        }
        if (useAgent.getState().running) stopAgent()
        else if (useStore.getState().streaming) useStore.getState().stop()
        return
      }

      // Check modifier shortcuts (Ctrl on Windows/Linux or Cmd on Mac)
      const mod = e.ctrlKey || e.metaKey

      if (mod && (e.key === 'k' || e.key === 'K') && !isInput) {
        e.preventDefault()
        useStore.getState().newChat()
        return
      }

      if (mod && e.shiftKey) {
        const k = e.key.toLowerCase()
        if (k === 'l') {
          e.preventDefault()
          useStore.getState().newChat()
        } else if (k === 'h') {
          e.preventDefault()
          const currentView = useStore.getState().view
          useStore.getState().setView(currentView === 'history' ? 'chat' : 'history')
        } else if (k === 's') {
          e.preventDefault()
          useStore.getState().toggleWebSearch()
        } else if (k === 'a') {
          e.preventDefault()
          const currentMode = useStore.getState().agentMode
          useStore.getState().setAgentMode(!currentMode)
        }
        return
      }

      if (!isInput && e.key === '?') {
        e.preventDefault()
        useStore.getState().setShortcutsOpen(true)
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (!ready || !settings) return <div className="app" />

  const noKey = !settings.apiKey || keyInvalid

  return (
    <div className="app">
      <Header />
      {view === 'history' ? (
        <History />
      ) : noKey ? (
        <NoKey />
      ) : (
        <>
          <Thread />
          <Composer />
        </>
      )}

      <Dialog
        open={shortcutsOpen}
        title="Keyboard shortcuts"
        confirmLabel="Got it"
        onConfirm={() => setShortcutsOpen(false)}
        onClose={() => setShortcutsOpen(false)}
      >
        <div className="shortcuts-table">
          <div className="shortcut-row">
            <span>Toggle side panel</span>
            <span className="shortcut-keys"><kbd>Alt</kbd> <kbd>B</kbd></span>
          </div>
          <div className="shortcut-row">
            <span>New conversation</span>
            <span className="shortcut-keys"><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>L</kbd></span>
          </div>
          <div className="shortcut-row">
            <span>Toggle History view</span>
            <span className="shortcut-keys"><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>H</kbd></span>
          </div>
          <div className="shortcut-row">
            <span>Toggle Web Search</span>
            <span className="shortcut-keys"><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>S</kbd></span>
          </div>
          <div className="shortcut-row">
            <span>Toggle Act mode</span>
            <span className="shortcut-keys"><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>A</kbd></span>
          </div>
          <div className="shortcut-row">
            <span>Stop generation / agent</span>
            <span className="shortcut-keys"><kbd>Esc</kbd></span>
          </div>
          <div className="shortcut-row">
            <span>Show this cheatsheet</span>
            <span className="shortcut-keys"><kbd>?</kbd></span>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
