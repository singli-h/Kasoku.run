import React from "react"
import PropTypes from "prop-types"

const Header = ({ title, description }) => (
  <div className="max-w-6xl mx-auto">
    <h1 className="h1 mb-4">{title}</h1>
    <p className="text-xl text-gray-400 mb-8">{description}</p>
  </div>
)

Header.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
}

export default Header