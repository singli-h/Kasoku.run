import React from "react"
import PropTypes from "prop-types"

const Button = ({ secondary, children, ...props }) => (
  <button
    className={`btn text-gray-200 w-full sm:w-auto sm:ml-4 ${
      secondary
        ? "bg-gray-700 hover:bg-gray-800"
        : "bg-yellow-600 hover:bg-yellow-700"
    }`}
    {...props}
  >
    {children}
  </button>
)

Button.propTypes = {
  children: PropTypes.node,
  secondary: PropTypes.bool,
}

Button.defaultProps = {
  children: "Link Button Text",
  secondary: false,
}

export default Button
