export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Ensure endpoint starts with /api
  const url = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
  }

  return response
}