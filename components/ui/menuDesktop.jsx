"use client"

import PropTypes from "prop-types"
import LinkButton from "../common/LinkButton"

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
                <LinkButton href={nav.href}>{nav.title}</LinkButton>
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
