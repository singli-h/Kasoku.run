"use client"

import React from "react"
import Header from "../../src/components/common/Header"
import EntryComponent from "../../src/pages/form/EntryComponent"

const Page = () => {
  const sectionMessage = {
    title: "Data Entry",
    paragraph: "Description",
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
        <Header
          title={sectionMessage.title}
          description={sectionMessage.paragraph}
        />
        <EntryComponent />
      </div>
    </>
  )
}

export default Page
