import React from "react"
import { useTranslation } from "react-i18next"

const ContactUs = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{t("contact-us.title")}</h1>
      <p>{t("contact-us.description")}</p>
      {/* Add your contact information or contact form here */}
    </div>
  )
}

export default ContactUs
