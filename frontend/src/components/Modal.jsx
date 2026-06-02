import React from 'react'

export default function Modal({ isOpen, onClose, title, children, size = '' }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${size ? ' ' + size : ''}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
