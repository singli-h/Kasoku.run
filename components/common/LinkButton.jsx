import React from "react"
import PropTypes from "prop-types"

const LinkButton = ({ href, children, secondary }) => (
  <a
    className={`btn text-white w-full sm:w-auto sm:ml-4 ${
      secondary
        ? "bg-gray-700 hover:bg-gray-800"
        : "bg-purple-600 hover:bg-purple-700"
    }`}
    href={href}
  >
    {children}
  </a>
)

LinkButton.propTypes = {
  href: PropTypes.string,
  children: PropTypes.node,
  secondary: PropTypes.bool,
}

LinkButton.defaultProps = {
  href: "#0",
  children: "Link Button Text",
  secondary: false,
}

export default LinkButton
