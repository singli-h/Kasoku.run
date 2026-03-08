# TipTap Editor Research & Implementation Plan

## Overview
TipTap is a headless rich-text editor built on ProseMirror, offering excellent React integration and markdown support. It's ideal for our knowledge base editor needs.

## Deep Dive Research (2025)

### Core Architecture
- **ProseMirror Foundation**: Built on ProseMirror's robust document model
- **Headless Design**: Complete UI control, perfect for design system integration
- **Extension System**: Modular architecture with 100+ extensions
- **React Integration**: Native React hooks and components
- **TypeScript Support**: Full type safety throughout

### Performance Characteristics
- **Bundle Size**: ~50KB gzipped for core + starter kit
- **Memory Usage**: Efficient document model, minimal memory footprint
- **Rendering**: Virtual DOM integration, smooth editing experience
- **Mobile Performance**: Touch-optimized, works well on mobile devices

## Key Features for Knowledge Base

### Core Capabilities
- **WYSIWYG Editing**: Real-time visual editing with toolbar
- **Markdown Support**: Native markdown import/export
- **React Integration**: Built-in React hooks and components
- **Extensible**: Plugin architecture for custom functionality
- **Collaborative**: Real-time collaboration support (optional)
- **Mobile Friendly**: Touch-optimized for mobile devices

### Required Extensions
```bash
npm install @tiptap/core @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-table @tiptap/extension-task-list
```

**Starter Kit Includes:**
- Bold, italic, underline, strikethrough
- Headings (H1-H6)
- Lists (ordered/unordered)
- Code blocks and inline code
- Blockquotes
- Horizontal rules
- History (undo/redo)
- Hard breaks
- Paragraph formatting

**Additional Extensions Installed:**
- `@tiptap/extension-image` - Image uploads with drag/drop
- `@tiptap/extension-link` - Link management with validation
- `@tiptap/extension-table` - Resizable tables with headers
- `@tiptap/extension-task-list` - Interactive task lists
- `@tiptap/extension-task-item` - Individual task items

**Future Extensions (V1.1):**
- `@tiptap/extension-mention` - @mentions for AI integration
- `@tiptap/extension-collaboration` - Real-time collaboration
- `@tiptap/extension-placeholder` - Better placeholder text
- `@tiptap/extension-character-count` - Character/word counting

## Implementation Architecture

### Editor Component Structure
```tsx
// components/features/knowledge-base/editor/article-editor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Markdown from '@tiptap/extension-markdown'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

export function ArticleEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="border rounded-lg">
      <EditorToolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[400px]"
      />
    </div>
  )
}
```

### Toolbar Component
```tsx
// components/features/knowledge-base/editor/editor-toolbar.tsx
export function EditorToolbar({ editor }) {
  if (!editor) return null

  return (
    <div className="border-b p-2 flex items-center space-x-1">
      <Button
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      {/* More toolbar buttons */}
    </div>
  )
}
```

## Content Storage Strategy

### Database Schema
```sql
-- Lean schema as requested
CREATE TABLE knowledge_articles (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id),
  title VARCHAR(200) NOT NULL,
  content JSONB NOT NULL, -- TipTap JSON format
  category_id VARCHAR(50), -- References user's category JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-specific categories (JSON per user as requested)
CREATE TABLE coach_categories (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES coaches(id),
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Content Format
TipTap stores content as JSON, which is perfect for our needs:
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Article Title" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Article content..." }]
    }
  ]
}
```

## Implementation Phases

### Phase 1: Basic Editor (MVP)
- Install TipTap core packages
- Implement basic editor with StarterKit
- Add markdown import/export
- Create article create/edit pages
- Basic toolbar (bold, italic, headings, lists)

### Phase 2: Enhanced Features
- Image upload integration
- Link management
- Table support
- Task lists
- Better mobile experience

### Phase 3: Advanced Features
- Collaborative editing
- AI integration (@mentions)
- Advanced formatting
- Export to PDF/Word

## Benefits for Knowledge Base

1. **Coach-Friendly**: WYSIWYG interface familiar to non-technical users
2. **Markdown Compatible**: Easy import/export for content migration
3. **AI Ready**: JSON format perfect for AI processing and context
4. **Mobile Optimized**: Touch-friendly for mobile editing
5. **Extensible**: Easy to add features as needs grow

## Migration Strategy

### From Existing Content
- Convert existing markdown to TipTap JSON
- Preserve formatting and structure
- Batch import process for existing articles

### Future AI Integration
- TipTap JSON is perfect for AI context
- Can extract text content for embeddings
- Maintains structure for better AI understanding

## Performance Considerations

- **Lazy Loading**: Load editor only when needed
- **Debounced Saving**: Auto-save with debounce
- **Image Optimization**: Compress images on upload
- **Content Caching**: Cache rendered content for reading

## Security Considerations

- **Content Sanitization**: Strip dangerous HTML
- **Image Upload Limits**: Size and type restrictions
- **XSS Prevention**: Sanitize user input
- **Access Control**: Coach-only editing (RLS)

## Next Steps

1. **Install Dependencies**: Add TipTap packages to package.json
2. **Create Editor Component**: Basic editor with toolbar
3. **Integrate with Forms**: React Hook Form + Zod validation
4. **Add to Article Pages**: Create/edit article functionality
5. **Test with Sample Data**: Ensure smooth editing experience

## Estimated Timeline

- **Basic Editor**: 1-2 days
- **Enhanced Features**: 2-3 days
- **Advanced Features**: 1-2 weeks
- **Testing & Polish**: 1 day

Total: ~1 week for full implementation
