"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"
import { getMyOrgActivities, updateActivityStatus } from "@/services/activity.service"

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  running: "bg-blue-100 text-blue-700",
  finished: "bg-purple-100 text-purple-600",
  cancelled: "bg-red-100 text-red-600",
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Bản nháp",
  pending_review: "Chờ duyệt",
  published: "Đã công bố",
  running: "Đang diễn ra",
  finished: "Đã kết thúc",
  cancelled: "Đã hủy",
}

const TYPE_LABEL: Record<string, string> = {
  program: "Chương trình",
  competition: "Cuộc thi",
  recruitment: "Tuyển sinh",
}

const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  { value: "draft", label: "Bản nháp" },
  { value: "pending_review", label: "Chờ duyệt" },
  { value: "published", label: "Đã công bố" },
  { value: "running", label: "Đang diễn ra" },
  { value: "finished", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" },
]

export default function OrgEventPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["my-org-activities", activeTab, page],
    queryFn: () => getMyOrgActivities({ page, limit: 10, status: activeTab || undefined }),
  })

  // Badge counts
  const { data: pendingData } = useQuery({
    queryKey: ["my-org-activities-pending"],
    queryFn: () => getMyOrgActivities({ status: "pending_review", limit: 1 }),
    staleTime: 30_000,
  })
  const { data: runningData } = useQuery({
    queryKey: ["my-org-activities-running"],
    queryFn: () => getMyOrgActivities({ status: "running", limit: 1 }),
    staleTime: 30_000,
  })

  const pendingCount = pendingData?.data?.meta?.total ?? 0
  const runningCount = runningData?.data?.meta?.total ?? 0

  const submitMut = useMutation({
    mutationFn: (id: number) => updateActivityStatus(id, "pending_review"),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["my-org-activities"] })
      const finalStatus = (result as any)?.data?.activityStatus
      if (finalStatus === "published") {
        toast.success("Hoạt động đã được đăng công khai!")
      } else {
        toast.success("Đã gửi yêu cầu duyệt!")
      }
    },
    onError: () => toast.error("Gửi thất bại, vui lòng thử lại"),
  })

  const activities = data?.data?.data ?? []
  const meta = data?.data?.meta

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
  }

  return (
    <div className="px-[60px] py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-[#0E5C63]">QUẢN LÝ HOẠT ĐỘNG</h1>
        <div className="flex flex-col gap-2">
          <Link href="/organization/create-program">
            <button className="w-full bg-[#0E5C63] text-white px-4 py-2 rounded text-sm">
              + Tạo mới chương trình
            </button>
          </Link>
          <Link href="/organization/create-contest">
            <button className="w-full bg-[#0E5C63] text-white px-4 py-2 rounded text-sm">
              + Tạo mới cuộc thi
            </button>
          </Link>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-0 flex-wrap border-b mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={[
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.value
                ? "border-[#0E5C63] text-[#0E5C63]"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {tab.label}
            {tab.value === "pending_review" && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
            {tab.value === "running" && runningCount > 0 && (
              <span className="ml-1.5 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {runningCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="text-center py-16 text-gray-400">Chưa có hoạt động nào.</div>
      )}

      {!isLoading && activities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Tên hoạt động</th>
                <th className="px-4 py-3 text-left">Tổ chức</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Thời gian</th>
                <th className="px-4 py-3 text-left">Trạng thái</th>
                <th className="px-4 py-3 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activities.map((a) => (
                <tr key={a.activityId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium max-w-[240px] truncate">{a.activityName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {a.organization?.organizationName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{TYPE_LABEL[a.activityType] ?? a.activityType}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {a.startTime ? new Date(a.startTime).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.activityStatus] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[a.activityStatus] ?? a.activityStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/organization/event/${a.activityId}`}
                        className="text-[#0E5C63] hover:underline text-xs"
                      >
                        Chi tiết
                      </Link>
                      {a.activityStatus === "draft" && (
                        <button
                          onClick={() => submitMut.mutate(a.activityId)}
                          disabled={submitMut.isPending}
                          className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded hover:bg-yellow-600 disabled:opacity-50"
                        >
                          Gửi duyệt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 py-4 border-t">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-sm ${p === page ? "bg-[#0E5C63] text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
