# State Management Pattern

> **Last Updated**: 2025-12-25

This document describes the state management patterns used in Kasoku, including when to use each approach and how they integrate together.

## Overview

Kasoku uses a hybrid state management approach:

| Type | Solution | Use Case |
|------|----------|----------|
| Server State | TanStack Query | Data from server/database |
| Feature State | React Context | Complex feature-wide state |
| Component State | React Hooks | Local component state |
| Form State | React Hook Form | Form inputs and validation |

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Application                           │
├─────────────────────────────────────────────────────────────┤
│  Global Providers (QueryClientProvider, UserRoleProvider)   │
├─────────────────────────────────────────────────────────────┤
│  Feature Providers (SessionPlannerProvider, etc.)           │
├─────────────────────────────────────────────────────────────┤
│  Components (useQuery, useState, useForm)                   │
└─────────────────────────────────────────────────────────────┘
```

## Feature Context Pattern

For complex features with multiple components sharing state, use a Feature Context.

### Context Structure

```typescript
// context/session-planner-context.tsx
"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
  useMemo,
} from "react"

// 1. Define types
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface ContextValue {
  // State
  data: Data[]
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean

  // Actions
  addItem: (item: Item) => void
  updateItem: (id: string, updates: Partial<Item>) => void
  removeItem: (id: string) => void

  // Undo/Redo
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  // Save
  save: () => Promise<boolean>
}

// 2. Create context
const FeatureContext = createContext<ContextValue | null>(null)

// 3. Create hook
export function useFeatureContext(): ContextValue {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error("useFeatureContext must be used within FeatureProvider")
  }
  return context
}

// 4. Create provider
interface ProviderProps {
  children: ReactNode
  initialData?: Data[]
}

export function FeatureProvider({
  children,
  initialData = [],
}: ProviderProps) {
  // State
  const [data, setData] = useState<Data[]>(initialData)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // History for undo/redo
  const [history, setHistory] = useState<Data[][]>([initialData])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Auto-save refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Save to history
  const saveToHistory = useCallback((newData: Data[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(JSON.parse(JSON.stringify(newData)))
      return newHistory.slice(-50) // Keep last 50 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 49))
    setHasUnsavedChanges(true)
  }, [historyIndex])

  // Undo/Redo
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1)
      setData(history[historyIndex - 1])
      setHasUnsavedChanges(true)
    }
  }, [canUndo, historyIndex, history])

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1)
      setData(history[historyIndex + 1])
      setHasUnsavedChanges(true)
    }
  }, [canRedo, historyIndex, history])

  // Actions
  const addItem = useCallback((item: Item) => {
    const newData = [...data, item]
    setData(newData)
    saveToHistory(newData)
  }, [data, saveToHistory])

  // ... more actions

  // Save
  const save = useCallback(async (): Promise<boolean> => {
    setSaveStatus('saving')
    try {
      const result = await saveAction(data)
      if (result.isSuccess) {
        setSaveStatus('saved')
        setHasUnsavedChanges(false)
        setTimeout(() => setSaveStatus('idle'), 2000)
        return true
      }
      setSaveStatus('error')
      return false
    } catch {
      setSaveStatus('error')
      return false
    }
  }, [data])

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Memoize value
  const value = useMemo<ContextValue>(() => ({
    data,
    saveStatus,
    hasUnsavedChanges,
    addItem,
    updateItem,
    removeItem,
    canUndo,
    canRedo,
    undo,
    redo,
    save,
  }), [
    data, saveStatus, hasUnsavedChanges,
    addItem, updateItem, removeItem,
    canUndo, canRedo, undo, redo, save,
  ])

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  )
}
```

### Usage

```typescript
// page.tsx
export default function Page() {
  return (
    <FeatureProvider initialData={data}>
      <FeatureContent />
    </FeatureProvider>
  )
}

// FeatureContent.tsx
function FeatureContent() {
  const { data, addItem, save, saveStatus } = useFeatureContext()

  return (
    <div>
      {data.map(item => <ItemCard key={item.id} item={item} />)}
      <button onClick={() => addItem(newItem)}>Add</button>
      <button onClick={save} disabled={saveStatus === 'saving'}>
        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
```

## Auto-Save Pattern

For features that need automatic saving:

```typescript
const AUTOSAVE_DELAY = 2000 // 2 seconds

export function FeatureProvider({ children, enableAutoSave = true }) {
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (!enableAutoSave) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      await save()
    }, AUTOSAVE_DELAY)
  }, [enableAutoSave, save])

  // Trigger on data changes
  const addItem = useCallback((item: Item) => {
    const newData = [...data, item]
    setData(newData)
    saveToHistory(newData)
    scheduleAutoSave() // Auto-save after change
  }, [data, saveToHistory, scheduleAutoSave])
}
```

## Undo/Redo Pattern

Full implementation of undo/redo:

```typescript
const MAX_HISTORY = 50

function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState])
  const [index, setIndex] = useState(0)

  const current = history[index]

  const push = useCallback((state: T) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, index + 1)
      newHistory.push(JSON.parse(JSON.stringify(state)))
      return newHistory.slice(-MAX_HISTORY)
    })
    setIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [index])

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prev => prev - 1)
    }
  }, [index])

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prev => prev + 1)
    }
  }, [index, history.length])

  const canUndo = index > 0
  const canRedo = index < history.length - 1

  return { current, push, undo, redo, canUndo, canRedo }
}
```

## Combining with React Query

Context for UI state, Query for server state:

```typescript
function FeatureProvider({ children, featureId }) {
  // Server state via React Query
  const { data: serverData, isLoading } = useQuery({
    queryKey: ['feature', featureId],
    queryFn: () => getFeatureAction(featureId)
  })

  // Local UI state via Context
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Mutations via React Query
  const mutation = useMutation({
    mutationFn: updateFeatureAction,
    onSuccess: () => {
      queryClient.invalidateQueries(['feature', featureId])
    }
  })

  const value = {
    // Server state
    data: serverData,
    isLoading,
    save: mutation.mutate,

    // UI state
    selectedItems,
    toggleSelection: (id) => setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    }),
  }

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  )
}
```

## Save Status Indicator

Pattern for showing save status to users:

```typescript
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="flex items-center gap-2">
      {status === 'saving' && (
        <>
          <Spinner className="h-4 w-4" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-500">Save failed</span>
        </>
      )}
    </div>
  )
}
```

## AI Changeset Pattern

For AI-assisted features with pending changes approval:

```typescript
interface AIChangeset {
  id: string
  timestamp: number
  description: string
  items: ChangesetItem[]
  status: 'pending' | 'approved' | 'rejected'
}

interface ChangesetItem {
  type: 'add' | 'update' | 'remove'
  targetId?: string
  data?: Partial<Data>
}

function useAIChangesets() {
  const [changesets, setChangesets] = useState<AIChangeset[]>([])

  const addChangeset = useCallback((changeset: AIChangeset) => {
    setChangesets(prev => [...prev, changeset])
  }, [])

  const approveChangeset = useCallback((id: string) => {
    setChangesets(prev => prev.map(cs =>
      cs.id === id ? { ...cs, status: 'approved' } : cs
    ))

    // Apply the changes
    const changeset = changesets.find(cs => cs.id === id)
    if (changeset) {
      changeset.items.forEach(applyChange)
    }
  }, [changesets])

  const rejectChangeset = useCallback((id: string) => {
    setChangesets(prev => prev.map(cs =>
      cs.id === id ? { ...cs, status: 'rejected' } : cs
    ))
  }, [])

  return { changesets, addChangeset, approveChangeset, rejectChangeset }
}
```

## Best Practices

### 1. Memoize Context Value

```typescript
// ✅ GOOD: Memoized value
const value = useMemo(() => ({
  data, addItem, removeItem
}), [data, addItem, removeItem])

// ❌ BAD: New object every render
const value = { data, addItem, removeItem }
```

### 2. Keep Context Focused

```typescript
// ✅ GOOD: Single responsibility
<SessionProvider>
  <UIStateProvider>
    {children}
  </UIStateProvider>
</SessionProvider>

// ❌ BAD: Everything in one context
<AppContext.Provider value={{ user, theme, session, ui, ... }}>
```

### 3. Use Custom Hooks for Access

```typescript
// ✅ GOOD: Custom hook with error
export function useFeature() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error("useFeature must be used within FeatureProvider")
  }
  return context
}

// ❌ BAD: Direct context access
const context = useContext(FeatureContext) // May be null
```

### 4. Co-locate Related State

```typescript
// ✅ GOOD: Related state together
interface ContextValue {
  exercises: Exercise[]
  addExercise: (e: Exercise) => void
  updateExercise: (id: string, updates: Partial<Exercise>) => void
  removeExercise: (id: string) => void
}

// ❌ BAD: State spread across files
// exercises-context.tsx, exercises-add-context.tsx, ...
```

## Examples in Codebase

- `components/features/workout/context/exercise-context.tsx` - Workout exercise state
- `components/features/plans/session-planner/context/session-planner-context.tsx` - Session planning state

## Related Documentation

- [Hooks vs Context](./hooks-vs-context.md)
- [React Query Caching Pattern](./react-query-caching-pattern.md)
- [ActionState Pattern](./actionstate-pattern.md)
- [Feature Pattern](./feature-pattern.md)
