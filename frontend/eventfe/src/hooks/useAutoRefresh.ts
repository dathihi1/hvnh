"use client"
import { useEffect, useRef, useCallback } from "react"

// Refresh 5 minutes before the 30-minute cookie expires
const COOKIE_MAX_AGE_MS = 30 * 60 * 1000
const REFRESH_BUFFER_MS = 5 * 60 * 1000
const REFRESH_INTERVAL_MS = COOKIE_MAX_AGE_MS - REFRESH_BUFFER_MS // 25 minutes

// Module-level flag to prevent concurrent refresh calls across re-mounts
const refreshing = { current: false }

export function useAutoRefresh() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const doRefresh = useCallback(async () => {
    if (refreshing.current) return

    // Only refresh if there's an access token (user is logged in)
    const hasToken = document.cookie.includes("access_token=")
    if (!hasToken) return

    refreshing.current = true
    try {
      await fetch("/api/auth/refresh", { method: "POST" })
      // Middleware handles redirect if session is truly expired on protected routes
    } catch {
      // Silently fail — middleware will redirect on next navigation if needed
    } finally {
      refreshing.current = false
    }
  }, [])

  useEffect(() => {
    doRefresh()
    intervalRef.current = setInterval(doRefresh, REFRESH_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [doRefresh])
}
