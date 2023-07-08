import React from "react"
import { Routes, Route } from "react-router-dom"
import "./App.css"
import Layout from "./component/common/Layout"
import HomePage from "./pages/Home"
import ContactUsPage from "./pages/ContactUs"
import NotFoundPage from "./pages/NotFound"

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="contact" element={<ContactUsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
