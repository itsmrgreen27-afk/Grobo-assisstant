'use client'

import { Check, ListTodo, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTodos } from '@/hooks/use-todos'
import { playClick } from '@/lib/audio'

type TodoDrawerProps = {
  open: boolean
  onClose: () => void
  accent: string
}

export function TodoDrawer({ open, onClose, accent }: TodoDrawerProps) {
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompleted } = useTodos()
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus the input when the drawer opens.
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 320)
      return () => clearTimeout(id)
    }
  }, [open])

  const submit = () => {
    if (!draft.trim()) return
    playClick()
    addTodo(draft)
    setDraft('')
  }

  const remaining = todos.filter((t) => !t.done).length
  const hasCompleted = todos.some((t) => t.done)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Panel — slides in from the left */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Todo list"
        aria-hidden={!open}
        inert={!open}
        className="fixed left-0 top-0 z-50 flex h-full w-[min(88vw,360px)] flex-col border-r border-white/10 bg-neutral-950/80 text-white shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <ListTodo className="h-5 w-5" style={{ color: accent }} />
            Todo List
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close todo list"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Add task */}
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  submit()
                }
              }}
              placeholder="Add a task…"
              aria-label="New task"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus-visible:border-[rgba(56,225,214,0.6)]"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              aria-label="Add task"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-neutral-950 transition-opacity disabled:opacity-40"
              style={{ background: accent }}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
          {todos.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <ListTodo className="h-10 w-10 text-white/20" aria-hidden="true" />
              <p className="text-sm text-white/40">
                No tasks yet. Add one above to get started.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      playClick()
                      toggleTodo(todo.id)
                    }}
                    aria-pressed={todo.done}
                    aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors"
                    style={{
                      borderColor: todo.done ? accent : 'rgba(255,255,255,0.25)',
                      background: todo.done ? accent : 'transparent',
                    }}
                  >
                    {todo.done && (
                      <Check className="h-3.5 w-3.5 text-neutral-950" strokeWidth={3} />
                    )}
                  </button>
                  <span
                    className="min-w-0 flex-1 break-words text-sm transition-colors"
                    style={{
                      color: todo.done
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(255,255,255,0.9)',
                      textDecoration: todo.done ? 'line-through' : 'none',
                    }}
                  >
                    {todo.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playClick()
                      deleteTodo(todo.id)
                    }}
                    aria-label="Delete task"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 opacity-0 transition-all hover:bg-white/10 hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between border-t border-white/10 px-5 py-4">
          <span className="text-xs text-white/50">
            {remaining} {remaining === 1 ? 'task' : 'tasks'} left
          </span>
          {hasCompleted && (
            <button
              type="button"
              onClick={() => {
                playClick()
                clearCompleted()
              }}
              className="text-xs font-medium text-white/50 transition-colors hover:text-white"
            >
              Clear completed
            </button>
          )}
        </footer>
      </aside>
    </>
  )
}
