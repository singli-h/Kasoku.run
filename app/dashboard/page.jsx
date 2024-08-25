"use client"

export const metadata = {
  title: "Dashboard",
}

import React from "react"
import Header from "@/components/common/Header"
import DashboardComponenet from "@/components/dashboard/DashboardComponent"

const Page = () => {
  const sectionMessage = {
    title: "Dashboard",
    paragraph: "Description",
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
      <Header
        title={sectionMessage.title}
        description={sectionMessage.paragraph}
      />
      <DashboardComponenet />
    </div>
  )
}

export default Page
