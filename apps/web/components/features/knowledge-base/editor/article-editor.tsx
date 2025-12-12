"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './editor-toolbar'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { TipTapContent } from '@/types/tiptap'

interface ArticleEditorProps {
  content?: TipTapContent
  onChange?: (content: TipTapContent) => void
  onSave?: () => void
  placeholder?: string
  className?: string
}

export function ArticleEditor({ 
  content = '', 
  onChange, 
  onSave,
  placeholder = 'Start writing your article...',
  className = ''
}: ArticleEditorProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!editor || !onSave) return
    
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg border',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Underline,
      TaskList,
      TaskItem,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] }, // TipTap JSON format
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange?.(json)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[600px] p-6 prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground prose-pre:text-foreground prose-pre:bg-muted',
        placeholder: placeholder,
      },
      handleKeyDown: (view, event) => {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 's':
              event.preventDefault()
              handleSave()
              return true
            case 'z':
              if (event.shiftKey) {
                // Ctrl+Shift+Z for redo
                editor?.chain().focus().redo().run()
              } else {
                // Ctrl+Z for undo
                editor?.chain().focus().undo().run()
              }
              return true
            case 'y':
              // Ctrl+Y for redo (alternative)
              event.preventDefault()
              editor?.chain().focus().redo().run()
              return true
            case 'b':
              event.preventDefault()
              editor?.chain().focus().toggleBold().run()
              return true
            case 'i':
              event.preventDefault()
              editor?.chain().focus().toggleItalic().run()
              return true
            case 'u':
              event.preventDefault()
              editor?.chain().focus().toggleUnderline().run()
              return true
          }
        }
        return false
      },
    },
  })


  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getJSON()
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content)
      }
    }
  }, [editor, content])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    // For now, create a placeholder image URL
    // In production, you'd upload to Supabase Storage
    const imageUrl = URL.createObjectURL(file)
    
    editor.chain().focus().setImage({ src: imageUrl }).run()
  }

  if (!editor) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} border-border bg-card`}>
      <EditorToolbar 
        editor={editor} 
        onImageUpload={handleImageUpload}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <CardContent className="p-0 bg-card">
        <EditorContent editor={editor} />
      </CardContent>
    </Card>
  )
}
