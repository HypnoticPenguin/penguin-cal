export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
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

export function formatDate(dateStr, format = 'YYYY-MM-DD') {
  if (!dateStr) return ''
  const cleanStr = String(dateStr).slice(0, 10)
  const parts = cleanStr.split('-')
  if (parts.length !== 3) return dateStr
  const [year, monthNum, day] = parts
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthName = months[parseInt(monthNum, 10) - 1] || monthNum

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${monthNum}-${year}`
    case 'DD-Mon-YYYY':
      return `${day}-${monthName}-${year}`
    case 'YYYY-MM-DD':
    default:
      return `${year}-${monthNum}-${day}`
  }
}