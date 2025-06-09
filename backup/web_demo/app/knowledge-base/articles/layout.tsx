"use server"

interface ArticlesLayoutProps {
  children: React.ReactNode
}

export default async function ArticlesLayout({ children }: ArticlesLayoutProps) {
  return children
} 