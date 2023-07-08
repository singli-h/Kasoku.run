import React from "react"
import { useTranslation } from "react-i18next"
import bannerImage from "../../assets/images/banner-background.jpg"

const Banner = () => {
  const { t } = useTranslation()

  return (
    <div
      className="text-center py-12 px-4 text-white"
      style={{
        backgroundImage: `url(${bannerImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
        {t("banner-title")}
      </h1>
      <p className="text-lg md:text-xl lg:text-2xl">{t("banner-subtitle")}</p>
    </div>
  )
}

export default Banner
