"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"

interface ClubApplication {
  applicationId: number
  submittedAt: string
  interviewTime: string | null
  result: string
  note: string | null
  activity: {
    activityId: number
    activityName: string
    organization: {
      organizationId: number
      organizationName: string
      logoUrl: string | null
    } | null
  } | null
}

const RESULT_MAP: Record<string, { label: string; color: string }> = {
  pending:  { label: "Đang chờ",    color: "text-yellow-600 bg-yellow-50" },
  approved: { label: "Đã duyệt",    color: "text-green-600 bg-green-50" },
  rejected: { label: "Từ chối",     color: "text-red-600 bg-red-50" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
}

async function getMyApplications() {
  return http.get<{ success: boolean; data: ClubApplication[] }>(
    `${envConfig.NEXT_PUBLIC_API_URL}/club-applications/my`
  )
}

export default function HistoryClubPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-club-applications"],
    queryFn: getMyApplications,
  })

  const applications = data?.data ?? []

  return (
    <div className="pb-[20px]">
      <div className="px-[40px]">
        <h2 className="text-[22px] font-bold text-[#05566B] mb-[20px]">Lịch sử ứng tuyển CLB</h2>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[70px] rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && applications.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            Bạn chưa ứng tuyển vào CLB nào.
          </div>
        )}

        {!isLoading && applications.length > 0 && (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-[14px]">
              <thead className="bg-[#05566B] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">CLB</th>
                  <th className="px-4 py-3 text-left font-semibold">Hoạt động</th>
                  <th className="px-4 py-3 text-left font-semibold">Ngày nộp</th>
                  <th className="px-4 py-3 text-left font-semibold">Phỏng vấn</th>
                  <th className="px-4 py-3 text-left font-semibold">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const result = RESULT_MAP[app.result] ?? { label: app.result, color: "text-gray-600 bg-gray-50" }
                  return (
                    <tr key={app.applicationId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#05566B]">
                        {app.activity?.organization?.organizationName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {app.activity ? (
                          <Link
                            href={`/event/${app.activity.activityId}`}
                            className="hover:underline text-[#05566B]"
                          >
                            {app.activity.activityName}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {app.interviewTime ? formatDate(app.interviewTime) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[12px] font-medium ${result.color}`}>
                          {result.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
