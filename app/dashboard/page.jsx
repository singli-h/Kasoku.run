"use client"

export const metadata = {
  title: "Dashboard",
}

import React from "react"
import Header from "@/components/common/Header"

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
    </div>
  )
}

export default Page
