"use client"

import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Image, 
  Link, 
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
  isSaving: boolean
}

export function EditorToolbar({ 
  editor, 
  onImageUpload, 
  onSave,
  isSaving
}: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="border-b border-border bg-card p-2 flex items-center space-x-1 flex-wrap gap-2">
      {/* Text Formatting */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Headings */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('taskList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Block Elements */}
      <div className="flex items-center space-x-1">
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Media & Links */}
      <div className="flex items-center space-x-1">
        <input
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          <Image className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* History */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto flex items-center space-x-2">
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          title="Save (Ctrl+S)"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
