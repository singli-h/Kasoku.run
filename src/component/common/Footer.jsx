import React from "react"
import { useTranslation } from "react-i18next"

const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer className="bg-blue-500 py-6 mt-8">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold text-white">
              {t("footer.quick-links")}
            </h3>
            <ul className="space-y-2 mt-2">
              <li>
                <a href="/" className="text-indigo-300 hover:text-indigo-200">
                  {t("footer.home")}
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-indigo-300 hover:text-indigo-200"
                >
                  {t("footer.contact-us")}
                </a>
              </li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h3 className="text-xl font-semibold text-white">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2 mt-2">
              <li>
                <a
                  href="/privacy-policy"
                  className="text-indigo-300 hover:text-indigo-200"
                >
                  {t("footer.privacy-policy")}
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-indigo-300 hover:text-indigo-200"
                >
                  {t("footer.terms-of-service")}
                </a>
              </li>
              {/* Add more legal links as needed */}
            </ul>
          </div>
        </div>
        {/* Copyright and Legal Notices */}
        <div className="mt-8">
          <p className="text-sm text-indigo-300 text-center">
            &copy; {new Date().getFullYear()} {t("footer.company-name")}.{" "}
            {t("footer.all-rights-reserved")}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
