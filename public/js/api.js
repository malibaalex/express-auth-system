const API_BASE = ""
let refreshInFlight = null

async function request(
  path,
  { method = "GET", body, headers = {}, retry = true } = {},
) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    return {
      ok: false,
      status: 0,
      body: {
        message:
          "Unable to reach the server. Check your connection and try again.",
      },
    }
  }
  const text = await response.text()
  let parsed = null
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { message: text }
    }
  }
  if (
    response.status === 401 &&
    retry &&
    path !== "/api/auth/refresh" &&
    path !== "/api/auth/email/sign-in"
  ) {
    const refreshed = await refreshSession()
    if (refreshed) return request(path, { method, body, headers, retry: false })
  }
  return { ok: response.ok, status: response.status, body: parsed ?? {} }
}

async function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = request("/api/auth/refresh", {
      method: "POST",
      retry: false,
    })
      .then((result) => result.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body }),
  patch: (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body }),
  delete: (path, options = {}) =>
    request(path, { ...options, method: "DELETE" }),
}

export function unwrapUser(body) {
  return body?.data?.user ?? body?.data ?? body?.user ?? body
}
export function messageOf(
  result,
  fallback = "Something went wrong. Please try again.",
) {
  return result?.body?.message ?? result?.body?.error?.message ?? fallback
}
