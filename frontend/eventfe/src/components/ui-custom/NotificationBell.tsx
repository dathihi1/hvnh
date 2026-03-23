"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Check, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
} from "@/services/notification.service"

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Vừa xong"
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} giờ trước`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} ngày trước`
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const typeLabel: Record<string, string> = {
  registration: "Đăng ký",
  application:  "Tuyển sinh",
  reminder:     "Nhắc lịch",
  announcement: "Thông báo",
  result:       "Kết quả",
  system:       "Hệ thống",
  admin:        "Quản trị",
  team:         "Đội nhóm",
}

export function NotificationBell() {
  const [isOpen, setIsOpen]             = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading]       = useState(false)
  const [mounted, setMounted]           = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const hasToken = mounted && document.cookie.includes("access_token=")

  // ── fetch unread count ──────────────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    if (!document.cookie.includes("access_token=")) return
    try {
      const res = await getUnreadCount() as any
      if (res?.success) setUnreadCount(res.data?.unreadCount ?? 0)
    } catch {
      // Network error — fail silently, badge stays at last known count
    }
  }, [])

  useEffect(() => {
    if (!hasToken) return
    fetchCount()
    const id = setInterval(fetchCount, 60_000)
    return () => clearInterval(id)
  }, [fetchCount, hasToken])

  // ── close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ── toggle dropdown ─────────────────────────────────────────────────────────
  async function toggle() {
    if (isOpen) { setIsOpen(false); return }
    setIsOpen(true)
    setIsLoading(true)
    try {
      const res = await getMyNotifications({ limit: 15 }) as any
      if (res?.success) setNotifications(res.data?.data ?? [])
    } catch {
      // Network error — show empty state
    } finally {
      setIsLoading(false)
    }
  }

  // ── mark one as read ────────────────────────────────────────────────────────
  async function handleMarkRead(id: number) {
    await markAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => n.notificationId === id ? { ...n, status: "read" } : n)
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  // ── mark all as read ────────────────────────────────────────────────────────
  async function handleMarkAllRead() {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })))
    setUnreadCount(0)
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(id: number, wasUnread: boolean) {
    await deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.notificationId !== id))
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
  }

  if (!mounted || !hasToken) return null

  return (
    <div ref={ref} className="relative">
      {/* ── bell button ── */}
      <button
        onClick={toggle}
        className="relative flex items-center justify-center w-[30px] h-[30px]"
        aria-label="Thông báo"
      >
        <Bell size={22} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── dropdown panel ── */}
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-[380px] bg-white rounded-[12px] shadow-2xl border border-gray-100 overflow-hidden z-[9999]">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-[14px] text-gray-800">
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[12px] text-[#05566B] font-medium hover:underline flex items-center gap-1"
              >
                <Check size={13} />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* list */}
          <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
            {isLoading && (
              <div className="flex justify-center items-center py-10">
                <Loader2 size={22} className="animate-spin text-[#05566B]" />
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="text-center text-gray-400 text-[13px] py-10">
                Chưa có thông báo nào.
              </div>
            )}

            {!isLoading && notifications.map((n) => (
              <div
                key={n.notificationId}
                className={`group flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                  n.status === "unread" ? "bg-blue-50/40" : ""
                }`}
                onClick={() => n.status === "unread" && handleMarkRead(n.notificationId)}
              >
                {/* unread dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${n.status === "unread" ? "bg-[#05566B]" : "bg-transparent"}`} />
                </div>

                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[13px] leading-snug truncate ${n.status === "unread" ? "font-semibold text-gray-900" : "font-normal text-gray-700"}`}>
                      {n.title}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.notificationId, n.status === "unread") }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {n.content && (
                    <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {n.notificationType && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                        {typeLabel[n.notificationType] ?? n.notificationType}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {formatTime(n.notificationTime)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[12px] text-[#05566B] hover:underline font-medium"
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
