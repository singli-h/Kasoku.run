"use client"

import React from "react"
import Header from "../../src/components/common/Header"
import DashboardComponent from "../../src/pages/dashboard/DashboardComponent"

const Page = () => {
  const sectionMessage = {
    title: "Dashboard",
    paragraph: "Description",
  }

  return (
    <div>
      <Header
        title={sectionMessage.title}
        description={sectionMessage.paragraph}
      />
      <DashboardComponent />
    </div>
  )
}

export default Page
