import React from "react"
import PropTypes from "prop-types"
import Link from "next/link"

const LinkButton = ({ href, secondary, children, ...props }) => (
  <Link
    href={href}
    className={`font-medium px-4 py-3 flex items-center justify-center ${
      secondary
        ? "text-gray-700 hover:text-gray-800"
        : "text-yellow-600 hover:text-yellow-700"
    }`}
    {...props}
  >
    {children}
  </Link>
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
