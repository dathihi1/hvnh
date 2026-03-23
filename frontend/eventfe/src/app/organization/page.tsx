"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, Users, GraduationCap, MapPin, CalendarDays, UserCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getMyOrganization, getOrgStats } from "@/services/organization.service"
import { getMyOrgActivities } from "@/services/activity.service"
import type { Activity as ActivityType } from "@/services/activity.service"

const TYPE_LABEL: Record<string, string> = {
  program: "Chương trình",
  competition: "Cuộc thi",
  recruitment: "Tuyển sinh",
}

const TYPE_COLOR: Record<string, string> = {
  program: "bg-teal-50 text-teal-700 border-teal-200",
  competition: "bg-orange-50 text-orange-700 border-orange-200",
  recruitment: "bg-purple-50 text-purple-700 border-purple-200",
}

const COVER_GRADIENT: string[] = [
  "from-teal-500 to-emerald-600",
  "from-blue-500 to-indigo-600",
  "from-orange-500 to-amber-600",
  "from-purple-500 to-violet-600",
]

function StatsCard({ title, value, icon, loading }: {
  title: string; value: number | string; icon: React.ReactNode; loading?: boolean
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4">
      <div className="w-11 h-11 bg-gray-50 border rounded-full flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        )}
      </div>
    </div>
  )
}

function RunningEventCard({ activity, index }: { activity: ActivityType; index: number }) {
  const gradient = COVER_GRADIENT[index % COVER_GRADIENT.length]
  const typeClass = TYPE_COLOR[activity.activityType] ?? "bg-gray-50 text-gray-600 border-gray-200"
  const typeLabel = TYPE_LABEL[activity.activityType] ?? activity.activityType

  return (
    <Link href={`/organization/event/${activity.activityId}`} className="group block">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[#0E5C63]/30 transition-all duration-200">
        {/* Cover strip */}
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />

        <div className="p-4 space-y-3">
          {/* Type badge */}
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${typeClass}`}>
            {typeLabel}
          </span>

          {/* Name */}
          <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 group-hover:text-[#0E5C63] transition-colors">
            {activity.activityName}
          </p>

          {/* Meta */}
          <div className="space-y-1.5">
            {activity.startTime && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span>{new Date(activity.startTime).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activity.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {activity._count?.registrations ?? 0}
                {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ""} người đăng ký
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Đang diễn ra
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0E5C63] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function OrganizationDashboard() {
  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: () => getMyOrganization(),
  })
  const org = orgData?.data

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["org-stats", org?.organizationId],
    queryFn: () => getOrgStats(org!.organizationId),
    enabled: !!org?.organizationId,
  })

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ["org-activities-running"],
    queryFn: () => getMyOrgActivities({ limit: 4, page: 1, status: "running" }),
    enabled: !!org?.organizationId,
  })

  const stats = statsData?.data
  const activities: ActivityType[] = (activitiesData as any)?.data?.data ?? []

  return (
    <div className="px-[120px] py-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Tổng quan</p>
        <h1 className="text-2xl font-bold text-[#0E5C63]">
          {org?.organizationName ?? "Đang tải..."}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Sự kiện đang hoạt động"
          value={stats?.activeActivities ?? 0}
          icon={<Activity className="w-5 h-5 text-green-500" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Tổng lượt đăng ký"
          value={stats?.totalRegistrations ?? 0}
          icon={<Users className="w-5 h-5 text-purple-500" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Thành viên mới tháng này"
          value={stats?.newMembers ?? 0}
          icon={<GraduationCap className="w-5 h-5 text-yellow-500" />}
          loading={statsLoading}
        />
      </div>

      {/* Running events */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-800">Sự kiện đang diễn ra</h2>
            <p className="text-xs text-gray-400 mt-0.5">Nhấn vào thẻ để quản lý sự kiện</p>
          </div>
          <Link
            href="/organization/event"
            className="flex items-center gap-1.5 text-sm text-[#0E5C63] hover:underline font-medium"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activitiesLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {activities.map((a, i) => (
              <RunningEventCard key={a.activityId} activity={a} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Chưa có sự kiện nào đang diễn ra</p>
            <Link href="/organization/event" className="inline-block mt-3 text-xs text-[#0E5C63] hover:underline">
              Xem tất cả sự kiện
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
