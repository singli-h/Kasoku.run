// New SSR Tasks page with server action
import { createServerSupabaseClient } from '@/lib/supabase'

// Force dynamic rendering for fresh data each request
export const dynamic = 'force-dynamic'

// Server Action: handle form submission to add a new task
enum FormDataKey {
  Name = 'name'
}
export async function addTask(formData: FormData) {
  'use server'
  const name = formData.get(FormDataKey.Name)
  if (typeof name !== 'string' || !name.trim()) {
    return
  }
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('tasks').insert({ name })
  if (error) {
    console.error('Error inserting task:', error)
  }
}

// Server Component: fetch and render tasks list
export default async function TasksPage() {
  const supabase = await createServerSupabaseClient()
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>

      {/* Form to add a new task */}
      <form action={addTask} className="mb-4 flex space-x-2">
        <input
          name="name"
          type="text"
          placeholder="Add a new task"
          required
          className="flex-grow border rounded-l px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded-r"
        >
          Add
        </button>
      </form>

      {/* Render list of tasks */}
      <ul className="list-disc pl-5 space-y-1">
        {tasks?.map((task: any) => (
          <li key={task.id} className="flex justify-between">
            <span>{task.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
} 