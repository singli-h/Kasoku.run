import React, { useState } from "react"
import PropTypes from "prop-types"

const AccordionItem = ({ title, description }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`border rounded my-2 transition-all ${
        isOpen ? "bg-blue-100" : "hover:bg-blue-50"
      }`}
    >
      <button
        className="w-full py-2 px-3 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex justify-between">
          <h3 className={`font-semibold text-xl ${isOpen && "text-blue-500"}`}>
            {title}
          </h3>
          {isOpen ? <span>&#9650;</span> : <span>&#9660;</span>}
        </div>
      </button>
      {isOpen && <p className="px-3 py-2">{description}</p>}
    </div>
  )
}

AccordionItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
}

const InformativeAccordion = ({ items }) => (
  <div>
    {items.map((point, index) => (
      <AccordionItem key={index} {...point} />
    ))}
  </div>
)

InformativeAccordion.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
}

export default InformativeAccordion
