import React from "react"
import { useTranslation } from "react-i18next"

const NotFound = () => {
  const { t } = useTranslation()

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">{t("not-found.title")}</h1>
      <p>{t("not-found.description")}</p>
    </div>
  )
}

export default NotFound
