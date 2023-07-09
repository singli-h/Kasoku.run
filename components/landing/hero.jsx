"use client"

import Button from "@/components/common/Button"

export default function Hero() {
  const sectionMessage = {
    title: "Welcome to your ",
    titleHightlight: "Runner Tracker",
    paragraph: "Description",
  }

  const navigationList = [
    { title: "Primary", href: "#primary", secondary: false },
    { title: "Secondary", href: "#secondary", secondary: true },
  ]

  return (
    <section>
      {/* Hero content */}
      <div className="relative pt-32 pb-10 md:pt-40 md:pb-16">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
          <h1 className="h1 mb-4" data-aos="fade-up">
            {sectionMessage.title}
            <span className="text-yellow-600">
              {sectionMessage.titleHightlight}
            </span>
          </h1>
          <p
            className="text-xl text-gray-400 mb-8"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {sectionMessage.paragraph}
          </p>
          <div className="max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center mb-12">
            {navigationList.map((nav, index) => {
              return (
                <div
                  className="ml-4"
                  data-aos="fade-up"
                  data-aos-delay="400"
                  key={index}
                >
                  <Button
                    secondary={nav.secondary}
                    onClick={() => (window.location.href = nav.href)}
                  >
                    {nav.title}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
