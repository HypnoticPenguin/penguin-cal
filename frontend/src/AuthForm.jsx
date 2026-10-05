import { useState } from 'react'

export default function AuthForm({ onAuthSuccess, theme }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const activeTheme = theme || {
    bg: '#f4f6f8',
    cardBg: '#ffffff',
    text: '#333333',
    subText: '#666666',
    border: '#e0e0e0',
    primary: '#2196F3'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Ensure /api prefix is present
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    try {
      let response
      if (isLogin) {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        })
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              username,
              display_name: displayName || username,
              password
            }),
        })
      }

      const contentType = response.headers.get('content-type')
      let data = {}
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        data = { detail: `Server error (${response.status}): ${text.slice(0, 100)}` }
      }

      if (response.ok) {
        localStorage.setItem('token', data.access_token)
        onAuthSuccess()
      } else {
        setError(data.detail || 'Authentication failed. Please check credentials.')
      }
    } catch (err) {
      console.error('Auth request failed:', err)
      setError('Network error. Could not connect to backend.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.6rem',
    boxSizing: 'border-box',
    background: activeTheme.bg,
    color: activeTheme.text,
    border: `1px solid ${activeTheme.border}`,
    borderRadius: '4px',
    fontSize: '0.95rem'
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        backgroundColor: activeTheme.bg,
        color: activeTheme.text,
        transition: 'all 0.3s ease',
        padding: '1rem',
        fontFamily: 'sans-serif'
      }}
    >
      <div
        style={{
          background: activeTheme.cardBg,
          color: activeTheme.text,
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          width: '100%',
          maxWidth: '380px',
          border: `1px solid ${activeTheme.border}`,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <img
            src="/penguin-logo.svg"
            alt="Penguin Calendar Logo"
            style={{ width: '54px', height: '54px', objectFit: 'contain' }}
          />
          <h2 style={{ textAlign: 'center', margin: 0, color: activeTheme.text }}>
            {isLogin ? 'Welcome to Penguin Calendar' : 'Create Account'}
          </h2>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(211, 47, 47, 0.1)',
              color: '#d32f2f',
              border: '1px solid #d32f2f',
              padding: '0.6rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              wordBreak: 'break-word'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', color: activeTheme.text }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', color: activeTheme.text }}>
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', color: activeTheme.text }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              background: activeTheme.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '0.5rem',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: activeTheme.subText }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: activeTheme.primary,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 'bold',
              padding: 0
            }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}