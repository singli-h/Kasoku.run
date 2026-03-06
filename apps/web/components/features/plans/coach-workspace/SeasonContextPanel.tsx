'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Sparkles, MessageSquare, Send, Loader2, ClipboardPaste } from 'lucide-react'
import { saveMacroPlanningContextAction } from '@/actions/plans/plan-actions'
import { useToast } from '@/hooks/use-toast'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface SeasonContextPanelProps {
  macrocycleId: number
  planningContext: string | null
  onContextUpdate?: (context: string) => void
}

export function SeasonContextPanel({ macrocycleId, planningContext, onContextUpdate }: SeasonContextPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(planningContext ?? '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Abort streaming on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  async function handleSave() {
    setSaving(true)
    const result = await saveMacroPlanningContextAction(macrocycleId, { text: value })
    setSaving(false)
    if (result.isSuccess) {
      setEditing(false)
      onContextUpdate?.(value)
      toast({ title: 'Season context saved' })
    } else {
      toast({ title: 'Save failed', description: result.message, variant: 'destructive' })
    }
  }

  // Auto-scroll chat to bottom when messages change
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function handleSendMessage() {
    const trimmed = chatInput.trim()
    if (!trimmed || streaming) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    // Keep last 48 messages + new user message to stay under API limit of 50
    const updatedMessages = [...messages.slice(-48), userMessage]
    setMessages(updatedMessages)
    setChatInput('')
    setStreaming(true)

    // Add placeholder assistant message for streaming
    const assistantIndex = updatedMessages.length
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ai/planning-context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          macroContext: value || undefined,
          mode: 'setup',
        }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let accumulated = ''
      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        accumulated += decoder.decode(chunk)
        setMessages(prev => {
          const updated = [...prev]
          updated[assistantIndex] = { role: 'assistant', content: accumulated }
          return updated
        })
      }
    } catch (e) {
      if (controller.signal.aborted) return
      toast({ title: 'Chat failed', description: String(e), variant: 'destructive' })
      // Remove empty assistant message on error
      setMessages(prev => prev.filter((_, i) => i !== assistantIndex))
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleApplyToContext(content: string) {
    setValue(content)
    setEditing(true)
    toast({ title: 'Applied to context', description: 'Review and save when ready.' })
  }

  const preview = value
    ? value.slice(0, 120) + (value.length > 120 ? '...' : '')
    : 'Add your season goals and coaching philosophy'

  return (
    <div className="border rounded-lg bg-muted/30 mb-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium shrink-0">Season Context</span>
          {!expanded && (
            <span className="text-muted-foreground text-xs truncate">{preview}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {editing ? (
            <>
              <Textarea
                value={value}
                onChange={e => setValue(e.target.value)}
                className="min-h-[120px] text-sm font-mono"
                placeholder="Season goals, training philosophy, competition calendar, group schedules..."
                maxLength={10000}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setValue(planningContext ?? ''); setEditing(false) }}>
                    Cancel
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {value.length.toLocaleString()} / 10,000
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {value || 'No planning context yet.'}
              </p>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            </>
          )}

          {/* AI Chat Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => setChatOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-left"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-xs">Chat with AI</span>
                {messages.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({messages.length} message{messages.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              {chatOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {chatOpen && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Describe your season goals and the AI will help structure your planning context.
                </p>

                {/* Messages */}
                {messages.length > 0 && (
                  <div
                    ref={scrollRef}
                    className="max-h-[300px] overflow-y-auto space-y-2 pr-1"
                  >
                    {messages.map((msg, i) => (
                      <div key={i} className={msg.role === 'user' ? 'flex justify-end' : ''}>
                        <div
                          className={
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm max-w-[85%]'
                              : 'bg-muted rounded-lg px-3 py-2 text-sm max-w-[85%] space-y-1'
                          }
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                          {msg.role === 'assistant' && msg.content && !streaming && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1 mt-1 px-1.5"
                              onClick={() => handleApplyToContext(msg.content)}
                            >
                              <ClipboardPaste className="h-3 w-3" />
                              Apply to context
                            </Button>
                          )}
                          {msg.role === 'assistant' && streaming && i === messages.length - 1 && !msg.content && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Thinking...
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <form
                  onSubmit={e => { e.preventDefault(); handleSendMessage() }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="e.g. I'm coaching U18 sprinters for summer champs..."
                    className="h-8 text-sm"
                    disabled={streaming}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    disabled={streaming || !chatInput.trim()}
                    aria-label="Send message"
                  >
                    {streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
