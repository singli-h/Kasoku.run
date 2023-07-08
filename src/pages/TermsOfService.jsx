import React from "react"
import { useTranslation } from "react-i18next"

const TermsOfService = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{t("terms-of-service.title")}</h1>
      <p>{t("terms-of-service.intro")}</p>
      {/* Add your terms of service content here */}
    </div>
  )
}

export default TermsOfService
