export default function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', confirmColor = '#4CAF50', theme, onConfirm, onClose }) {
  if (!isOpen) return null

  const activeTheme = theme || {
    cardBg: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
    bg: '#f4f6f8'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100
      }}
    >
      <div
        style={{
          background: activeTheme.cardBg,
          color: activeTheme.text,
          padding: '1.5rem',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%',
          border: `1px solid ${activeTheme.border}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        <h3 style={{ margin: '0 0 0.75rem 0', color: confirmColor }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: '#888',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1rem',
              background: confirmColor,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}