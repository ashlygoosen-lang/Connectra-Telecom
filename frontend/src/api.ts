// Thin client for the Connectra Express API (same origin in production, proxied in dev).

export type Phone = {
  slug: string; name: string; brand: string; data: string; price: number; upfront: number
  color: string; accent: string; badge?: string; rating: number; reviews: number; lead: string
  colors: { name: string; hex: string }[]; storage: { size: string; add: number }[]; features: string[]
}
export type InternetPlan = { id: string; name: string; speed: string; mbps: number; price: number; note: string; popular?: boolean }
export type VoipPlan = { id: string; name: string; audience: 'home' | 'business'; price: number; perUser: boolean; popular?: boolean; note: string; includes: string[] }
export type CoverageResult = { address: string; fibre: boolean; fiveG: boolean; lte: boolean; signal: number; maxSpeedMbps: number; plans: InternetPlan[] }
export type Article = { id: string; topic: string; title: string; body: string }
export type User = {
  id: string; name: string; firstName: string; email: string; initials: string
  plan: { name: string; monthly: number; renewsDay: number }
  usage: { usedGb: number; totalGb: number }
  bill: { amount: number; dueDay: number; cardLast4: string; autopay: boolean }
}
export type OrderSummary = { ref: string; status: string; createdAt: string; item: { name: string; detail: string; monthly: number; upfront: number } }

const TOKEN_KEY = 'connectra.token'
export const tokenStore = {
  get(): string | null { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set(t: string | null) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ } },
}

async function request<T>(path: string, options: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`/api${path}`, { method: options.method || 'GET', headers, body: options.body !== undefined ? JSON.stringify(options.body) : undefined })
  } catch {
    throw new Error('We could not reach Connectra. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

export const api = {
  phones: () => request<{ phones: Phone[] }>('/phones').then(d => d.phones),
  internetPlans: () => request<{ plans: InternetPlan[] }>('/plans/internet').then(d => d.plans),
  voipPlans: () => request<{ plans: VoipPlan[] }>('/plans/voip').then(d => d.plans),
  checkCoverage: (address: string) => request<{ result: CoverageResult }>('/coverage/check', { method: 'POST', body: { address } }).then(d => d.result),
  subscribe: (email: string) => request<{ message: string }>('/newsletter', { method: 'POST', body: { email } }),
  requestCallback: (body: { email: string; companySize: string; solution?: string }) => request<{ ref: string; message: string }>('/business/callback', { method: 'POST', body }),
  placeOrder: (body: unknown) => request<{ order: { ref: string; totals: { monthly: number; dueToday: number } } }>('/orders', { method: 'POST', body }),
  login: (email: string, password: string) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name: string, email: string, password: string) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: { name, email, password } }),
  me: () => request<{ user: User; orders: OrderSummary[] }>('/account/me'),
  topUp: (gb: number) => request<{ usage: User['usage']; bill?: User['bill']; message: string }>('/account/data-topup', { method: 'POST', body: { gb } }),
  searchArticles: (q: string, topic?: string) => request<{ articles: Article[] }>(`/support/articles?q=${encodeURIComponent(q)}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`).then(d => d.articles),
  createTicket: (body: { name: string; email: string; topic: string; message: string }) => request<{ ref: string; message: string }>('/support/tickets', { method: 'POST', body }),
}
