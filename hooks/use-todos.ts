'use client'

import { useCallback, useEffect, useState } from 'react'

export type Todo = {
  id: string
  text: string
  done: boolean
  createdAt: number
}

const STORAGE_KEY = 'robo-assistant-todos'

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load persisted todos after mount to avoid hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Todo[]
        if (Array.isArray(parsed)) setTodos(parsed)
      }
    } catch {
      // Ignore malformed storage.
    }
    setHydrated(true)
  }, [])

  // Persist whenever todos change (after initial hydration).
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch {
      // Ignore storage write failures (e.g. private mode).
    }
  }, [todos, hydrated])

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setTodos((prev) => [
      { id: makeId(), text: trimmed, done: false, createdAt: Date.now() },
      ...prev,
    ])
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.done))
  }, [])

  return { todos, hydrated, addTodo, toggleTodo, deleteTodo, clearCompleted }
}
