const API_BASE = import.meta.env.VITE_API_URL || '/api'

let passcode: string | null = localStorage.getItem('lesson-ledger-passcode')

export function setPasscode(code: string) {
  passcode = code
  localStorage.setItem('lesson-ledger-passcode', code)
}

export function clearPasscode() {
  passcode = null
  localStorage.removeItem('lesson-ledger-passcode')
}

export function hasPasscode(): boolean {
  return !!passcode
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (passcode) {
    headers['X-Passcode'] = passcode
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

function get(path: string) { return request(path) }
function post(path: string, body?: any) { return request(path, { method: 'POST', body: JSON.stringify(body) }) }
function put(path: string, body?: any) { return request(path, { method: 'PUT', body: JSON.stringify(body) }) }
function del(path: string) { return request(path, { method: 'DELETE' }) }

export const api = {
  auth: {
    login: (code: string) => post('/auth', { passcode: code }),
  },
  children: {
    list: (familyId: string) => get(`/children?family_id=${familyId}`),
    create: (body: any) => post('/children', body),
    update: (id: string, body: any) => put(`/children/${id}`, body),
    delete: (id: string) => del(`/children/${id}`),
  },
  organizations: {
    list: (familyId: string) => get(`/organizations?family_id=${familyId}`),
    create: (body: any) => post('/organizations', body),
    update: (id: string, body: any) => put(`/organizations/${id}`, body),
    delete: (id: string) => del(`/organizations/${id}`),
  },
  courses: {
    list: (params: { family_id?: string; child_id?: string }) => {
      const qs = new URLSearchParams(params as any).toString()
      return get(`/courses?${qs}`)
    },
    get: (id: string) => get(`/courses/${id}`),
    create: (body: any) => post('/courses', body),
    update: (id: string, body: any) => put(`/courses/${id}`, body),
    delete: (id: string) => del(`/courses/${id}`),
  },
  purchases: {
    list: (courseId: string) => get(`/purchases?course_id=${courseId}`),
    create: (body: any) => post('/purchases', body),
    update: (id: string, body: any) => put(`/purchases/${id}`, body),
    delete: (id: string) => del(`/purchases/${id}`),
  },
  records: {
    list: (courseId: string) => get(`/records?course_id=${courseId}`),
    create: (body: any) => post('/records', body),
    delete: (id: string) => del(`/records/${id}`),
  },
  stats: {
    course: (courseId: string) => get(`/stats/${courseId}`),
  },
  sync: {
    get: (familyId: string) => get(`/sync?family_id=${familyId}`),
  },
  families: {
    list: () => get('/families'),
    create: (name: string) => post('/families', { name }),
  },
}
