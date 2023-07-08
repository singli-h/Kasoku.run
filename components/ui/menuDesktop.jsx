"use client"

import PropTypes from "prop-types"
import Link from "next/link"

export default function MenuDesktop({ navigationList }) {
  return (
    <div>
      {/* Desktop navigation */}
      <nav className="hidden md:flex md:grow">
        {/* Desktop sign in links */}
        <ul className="flex grow justify-end flex-wrap items-center">
          {navigationList.map((nav, index) => {
            return (
              <li key={index}>
                <Link
                  href={nav.href}
                  className="font-medium text-purple-600 hover:text-gray-200 px-4 py-3 flex items-center transition duration-150 ease-in-out"
                >
                  {nav.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

MenuDesktop.propTypes = {
  navigationList: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ).isRequired,
}
