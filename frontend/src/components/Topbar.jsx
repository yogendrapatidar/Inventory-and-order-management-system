import React from 'react'
import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/orders': 'Orders',
}

export default function Topbar({ onMenuToggle }) {
  const location = useLocation()
  const title = titles[location.pathname] || 'Ethara'

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'none', fontSize: '1.2rem' }}
          className="menu-toggle"
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h2>{title}</h2>
      </div>
      <div className="topbar-right">
        <span className="topbar-badge">Live</span>
      </div>
    </header>
  )
}
