export default function DeleteModal({ isOpen, onClose, onDeleteSeries, onDeleteInstance }) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Delete Recurring Event</h3>
        <p style={{ color: '#555' }}>
          This is a repeating event. How would you like to delete it?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            onClick={onDeleteInstance}
            style={{
              padding: '0.6rem 1rem',
              background: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Delete Only This Instance
          </button>

          <button
            onClick={onDeleteSeries}
            style={{
              padding: '0.6rem 1rem',
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Delete Entire Series
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}