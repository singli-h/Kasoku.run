import React from "react"
import { useTranslation } from "react-i18next"

const PrivacyPolicy = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{t("privacy-policy.title")}</h1>
      <p>{t("privacy-policy.intro")}</p>
      {/* Add your privacy policy content here */}
    </div>
  )
}

export default PrivacyPolicy
