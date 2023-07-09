"use client"

import React, { useState } from "react"
import Button from "../common/Button"
import ExerciseForm from "./ExerciseForm"
import ExerciseTable from "./ExerciseTable"
import TrainingForm from "./TrainingForm"
import TrainingTable from "./TrainingTable"
import TemplateForm from "./TemplateForm"
import TemplateTable from "./TemplateTable"

const FormComponent = () => {
  const [exercises, setExercises] = useState([])
  const [trainings, setTrainings] = useState([])
  const [templates, setTemplates] = useState([])

  const addExercise = (data) => {
    setExercises([...exercises, data])
  }

  const addTraining = (data) => {
    setTrainings([...trainings, data])
  }

  const addTemplate = (data) => {
    setTemplates([...templates, data])
  }

  const submitForm = (event) => {
    event.preventDefault()
    console.log({ exercises, trainings, templates })
    // Call your API here with the data
  }

  return (
    <form onSubmit={submitForm} className="bg-gray-900 p-6">
      <ExerciseForm addExercise={addExercise} />
      <ExerciseTable exercises={exercises} />

      <TrainingForm addTraining={addTraining} savedExercises={exercises} />
      <TrainingTable trainings={trainings} />

      <TemplateForm addTemplate={addTemplate} />
      <TemplateTable templates={templates} />

      <Button type="submit">Submit</Button>
    </form>
  )
}

export default FormComponent
