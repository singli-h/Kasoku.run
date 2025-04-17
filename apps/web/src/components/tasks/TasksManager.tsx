"use client"
import { useState } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase.server'

enum FormDataKey {
  Name = 'name',
}

// Server action must be exported from a client component
export async function addTask(formData: FormData) {
  'use server'
  const name = formData.get(FormDataKey.Name)
  if (typeof name !== 'string' || !name.trim()) return

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('tasks').insert({ name })
  if (error) console.error('Error inserting task:', error)
}

type Task = { id: number; name: string }
interface Props {
  initialTasks: Task[]
}

export default function TasksManager({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>

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

      <ul className="list-disc pl-5 space-y-1">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between">
            <span>{task.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
} 