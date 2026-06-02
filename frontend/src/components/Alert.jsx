import React from 'react'

export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null
  return (
    <div className={`alert alert-${type}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
      )}
    </div>
  )
}
