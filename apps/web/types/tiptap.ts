import { Json } from './database'

// TipTap/ProseMirror document types
export interface TipTapDocument {
  type: 'doc'
  content: TipTapNode[]
}

export interface TipTapNode {
  type: string
  attrs?: Record<string, Json>
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
}

export interface TipTapMark {
  type: string
  attrs?: Record<string, Json>
}

export type TipTapContent = TipTapDocument | string
