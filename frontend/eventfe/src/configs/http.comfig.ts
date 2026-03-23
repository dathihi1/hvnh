const isServer = typeof window === "undefined";

function getAccessTokenFromCookie(): string | undefined {
  if (isServer) return undefined;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? match[1] : undefined;
}

// Track whether a refresh is in-flight to avoid concurrent refresh storms
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function fetchData<T>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: any,
  token?: string,
  nextOptions?: NextFetchRequestConfig,
): Promise<T | null> {
  const isFormData = body instanceof FormData;

  const options: any = {
    method,
    credentials: isServer ? "omit" : "include",
  };

  const headers: any = {};

  if (method !== "GET" && body) {
    options.body = isFormData ? body : JSON.stringify(body);
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
  }

  if (isServer && token) {
    if (token.startsWith("Bearer ")) {
      headers["Authorization"] = token;
    } else if (token.startsWith("access_token=")) {
      const match = token.match(/access_token=([^;]+)/);
      if (match) {
        headers["Authorization"] = `Bearer ${match[1]}`;
      }
    } else {
      headers["Cookie"] = token;
    }
  }

  if (!isServer) {
    const accessToken = getAccessTokenFromCookie();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  options.headers = headers;

  if (nextOptions) {
    options.next = nextOptions;
  }

  let result = await fetch(url, options);

  // 401 on client-side: try to refresh once and retry the original request
  if (
    result.status === 401 &&
    !isServer &&
    !url.includes("/auth/refresh-token") &&
    !url.includes("/auth/login")
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessTokenFromCookie();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        options.headers = headers;
      }
      result = await fetch(url, options);
    }
  }

  const data = await result.json();
  return data;
}

export const http = {
  get: <T>(url: string, token?: string, nextOptions?: NextFetchRequestConfig) =>
    fetchData<T>("GET", url, undefined, token, nextOptions),

  post: <T>(url: string, body: any, token?: string) =>
    fetchData<T>("POST", url, body, token),

  put: <T>(url: string, body: any, token?: string) =>
    fetchData<T>("PUT", url, body, token),

  delete: <T>(url: string, body: any, token?: string) =>
    fetchData<T>("DELETE", url, body, token),

  patch: <T>(url: string, body: any, token?: string) =>
    fetchData<T>("PATCH", url, body, token),
};
