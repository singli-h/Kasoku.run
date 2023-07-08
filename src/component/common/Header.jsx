import React from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import LanguageToggle from "./LanguageToggle"

const Header = () => {
  const { t } = useTranslation()

  return (
    <header className="bg-blue-500 text-white p-4">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-lg font-bold">
          {t("header.company-name")}
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/">{t("header.home")}</Link>
            </li>
            <li>
              <Link to="/resources">{t("header.resources")}</Link>
            </li>
            <li>
              <Link to="/about">{t("header.about")}</Link>
            </li>
            <li>
              <Link to="/feedback">{t("header.feedback")}</Link>
            </li>
          </ul>
        </nav>
        <LanguageToggle />
      </div>
    </header>
  )
}

export default Header
