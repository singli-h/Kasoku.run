import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { FaGlobeAmericas } from "react-icons/fa"

const LanguageToggle = () => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const changeLanguage = (language) => {
    i18n.changeLanguage(language)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <div className="bg-blue-500 rounded-full p-1 hover:bg-blue-700">
        <FaGlobeAmericas
          className="w-6 h-6 cursor-pointer text-white"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu"
          >
            <button
              onClick={() => changeLanguage("en")}
              className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-500 hover:text-white focus:outline-none"
              role="menuitem"
            >
              English
            </button>
            <button
              onClick={() => changeLanguage("zhtw")}
              className="block w-full text-left px-4 py-2 text-sm text-black hover:bg-blue-500 hover:text-white focus:outline-none"
              role="menuitem"
            >
              繁體
            </button>
            {/* Add more languages as needed */}
          </div>
        </div>
      )}
    </div>
  )
}

export default LanguageToggle
