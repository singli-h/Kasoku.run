import React, { useState } from "react"
import Button from "../common/Button"

const initialTemplateState = {
  name: "",
}

const TemplateForm = ({ addTemplate }) => {
  const [template, setTemplate] = useState(initialTemplateState)

  const handleTemplateChange = (event) => {
    setTemplate({ ...template, [event.target.name]: event.target.value })
  }

  const handleSubmit = () => {
    addTemplate(template)
    setTemplate(initialTemplateState) // Clear form after adding
  }

  return (
    <div className="my-4">
      <h2 className="text-gray-200 font-bold text-lg mb-2">Template Info</h2>

      <div className="mb-4">
        <label
          className="block text-gray-200 text-sm font-bold mb-2"
          htmlFor="name"
        >
          Template Name
        </label>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="name"
          type="text"
          placeholder="Template Name"
          name="name"
          value={template.name}
          onChange={handleTemplateChange}
        />
      </div>

      <Button onClick={handleSubmit}>Add Template</Button>
    </div>
  )
}

export default TemplateForm
