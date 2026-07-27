export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** Token de acceso para rutas protegidas. */
  token?: string
}

/** Cliente fetch tipado contra pos-backend. */
export async function apiFetch<T>(
  path: string,
  { body, token, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json")
  const data = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    const message =
      (isJson && (data as { message?: string })?.message) ||
      `Error ${res.status}`
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(", ") : String(message),
      data
    )
  }

  return data as T
}
