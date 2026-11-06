const API_BASE = (import.meta.env.VITE_NISRIN_API_URL || 'https://api.nisrin.no').replace(/\/$/, '')

export type NisrinUser = {
  id: number
  name: string
  email: string
  roles: string[]
}

export class NisrinApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'NisrinApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
    })
  } catch {
    throw new NisrinApiError('Kunne ikke kontakte NISRIN-API-et. Kontroller tilkoblingen.', 0)
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new NisrinApiError(
        'Administrator-API-et er foreløpig sperret på serveren. Ingen innlogging er utført.',
        403,
      )
    }
    if (response.status === 401) {
      throw new NisrinApiError('E-postadresse eller passord er feil, eller økten er utløpt.', 401)
    }
    if (response.status === 429) {
      throw new NisrinApiError('For mange forsøk. Prøv igjen senere.', 429)
    }
    throw new NisrinApiError('NISRIN-API-et svarte med en feil. Prøv igjen senere.', response.status)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new NisrinApiError('Ugyldig svar fra NISRIN-API-et.', response.status)
  }
}

export async function getSession(): Promise<NisrinUser | null> {
  try {
    const result = await request<{ user: NisrinUser | null }>('/auth/me')
    return result.user
  } catch (error) {
    if (error instanceof NisrinApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

export async function login(email: string, password: string): Promise<NisrinUser> {
  // NISRIN server generates a session-bound CSRF token.
  // If /auth/ is blocked, credentials are never sent.
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  const result = await request<{ user: NisrinUser }>('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ email, password }),
  })
  return result.user
}

export async function logout(): Promise<void> {
  const { csrfToken } = await request<{ csrfToken: string }>('/auth/csrf')
  await request<{ ok: true }>('/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: '{}',
  })
}
