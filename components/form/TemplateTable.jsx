import React from "react"

const TemplateTable = ({ templates }) => {
  return (
    <div className="my-4">
      <h2 className="text-gray-200 font-bold text-lg mb-2">Templates</h2>
      <table className="table-auto w-full text-left whitespace-no-wrap">
        <thead className="text-gray-200">
          <tr>
            <th className="px-4 py-2">Template Name</th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          {templates.map((template, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-700"}>
              <td className="px-4 py-2">{template.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TemplateTable
