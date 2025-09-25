"use server"

import { Suspense } from "react"
import { ExerciseLibraryPage } from "@/components/features/exercise"
import { PageLayout, UnifiedPageSkeleton } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Plus, Settings, ChevronDown } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"

export default async function LibraryPage() {
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Exercise
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Library Management</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise Type
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Plus className="h-4 w-4 mr-2" />
            Add Tag
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            Import Exercises
          </DropdownMenuItem>
          <DropdownMenuItem>
            Export Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <PageLayout
      title="Exercise Library"
      description="Browse and manage your exercise database with detailed instructions and videos"
      headerActions={headerActions}
    >
      <Suspense fallback={<UnifiedPageSkeleton title="Exercise Library" variant="grid" showActions={true} />}>
        <ExerciseLibraryPage />
      </Suspense>
    </PageLayout>
  )
} 