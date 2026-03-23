"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProfileForm } from "./ProfileForm"
import { ImageUpload } from "@/components/ui-custom/ImageUpload"
import { getMe } from "@/services/auth.service"
import { getMyRegistrations, cancelRegistration, createRegistration } from "@/services/registration.service"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"
import { toast } from "sonner"
import Link from "next/link"

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const APPLICATION_RESULT_LABEL: Record<string, string> = {
  pending:   "Đã nộp đơn",
  interview: "Chờ phỏng vấn",
  accepted:  "Trúng tuyển",
  rejected:  "Không trúng tuyển",
}

const APPLICATION_RESULT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending:   "secondary",
  interview: "outline",
  accepted:  "default",
  rejected:  "destructive",
}

// ─── Sub-tab: Đã đăng ký ─────────────────────────────────────────────────────
function RegisteredTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["my-registrations", "approved"],
    queryFn: () => getMyRegistrations(),
  })
  const registrations = (data?.data as any)?.data?.filter(
    (r: any) => r.status === "approved" || r.status === "pending"
  ) ?? []

  const handleCancel = async (id: number) => {
    try {
      const res = await cancelRegistration(id) as any
      if (res?.success) {
        toast.success("Hủy đăng ký thành công")
        queryClient.invalidateQueries({ queryKey: ["my-registrations"] })
      } else {
        toast.error(res?.message ?? "Hủy thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra")
    }
  }

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải...</div>
  if (!registrations.length) return <div className="py-8 text-center text-gray-400">Chưa có sự kiện đăng ký.</div>

  return (
    <div className="space-y-3">
      {registrations.map((r: any) => {
        const deadlinePassed = r.activity?.registrationDeadline
          ? new Date() > new Date(r.activity.registrationDeadline)
          : false
        return (
          <div key={r.registrationId} className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Link href={`/event/${r.activity?.activityId}`} className="font-medium text-[#05566B] hover:underline">
                {r.activity?.activityName ?? "—"}
              </Link>
              <div className="text-sm text-gray-500">{r.activity?.organization?.organizationName}</div>
              <div className="text-sm text-gray-500">Bắt đầu: {formatDate(r.activity?.startTime)}</div>
            </div>
            {!deadlinePassed && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-300 hover:bg-red-50"
                onClick={() => handleCancel(r.registrationId)}
              >
                Hủy đăng ký
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sub-tab: Đã tham gia ────────────────────────────────────────────────────
function AttendedTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-registrations", "attended"],
    queryFn: () => (http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/registrations/my?attended=true`)),
  })
  const registrations = (data as any)?.data?.data ?? []

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải...</div>
  if (!registrations.length) return <div className="py-8 text-center text-gray-400">Chưa tham gia sự kiện nào.</div>

  return (
    <div className="space-y-3">
      {registrations.map((r: any) => {
        const latestCheckin = r.registrationCheckins?.[0]
        return (
          <div key={r.registrationId} className="border rounded-lg p-4">
            <Link href={`/event/${r.activity?.activityId}`} className="font-medium text-[#05566B] hover:underline">
              {r.activity?.activityName ?? "—"}
            </Link>
            <div className="text-sm text-gray-500">{r.activity?.organization?.organizationName}</div>
            <div className="text-sm text-gray-500">
              Check-in: {formatDate(latestCheckin?.checkInTime)}
            </div>
            {latestCheckin?.checkOutTime && (
              <div className="text-sm text-gray-500">
                Check-out: {formatDate(latestCheckin.checkOutTime)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sub-tab: Phòng chờ ──────────────────────────────────────────────────────
function WaitlistTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["my-registrations", "waiting"],
    queryFn: () => (http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/registrations/my?status=waiting`)),
  })
  const registrations = (data as any)?.data?.data ?? []

  const handleCancel = async (id: number) => {
    try {
      const res = await cancelRegistration(id) as any
      if (res?.success) {
        toast.success("Hủy hàng chờ thành công")
        queryClient.invalidateQueries({ queryKey: ["my-registrations"] })
      } else {
        toast.error(res?.message ?? "Hủy thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra")
    }
  }

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải...</div>
  if (!registrations.length) return <div className="py-8 text-center text-gray-400">Không có sự kiện trong hàng chờ.</div>

  return (
    <div className="space-y-3">
      {registrations.map((r: any) => (
        <div key={r.registrationId} className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <Link href={`/event/${r.activity?.activityId}`} className="font-medium text-[#05566B] hover:underline">
              {r.activity?.activityName ?? "—"}
            </Link>
            <div className="text-sm text-gray-500">{r.activity?.organization?.organizationName}</div>
            <div className="text-sm text-gray-500">Bắt đầu: {formatDate(r.activity?.startTime)}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-300 hover:bg-red-50"
            onClick={() => handleCancel(r.registrationId)}
          >
            Hủy đăng ký
          </Button>
        </div>
      ))}
    </div>
  )
}

// ─── Sub-tab: Đã hủy ─────────────────────────────────────────────────────────
function CancelledTab() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["my-registrations", "cancelled"],
    queryFn: () => (http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/registrations/my?status=cancelled`)),
  })
  const registrations = (data as any)?.data?.data ?? []

  const handleReRegister = async (activityId: number, maxParticipants: number | null, registrationCount: number) => {
    try {
      const res = await createRegistration({ activityId }) as any
      if (res?.success) {
        toast.success("Đăng ký lại thành công!")
        queryClient.invalidateQueries({ queryKey: ["my-registrations"] })
      } else {
        toast.error(res?.message ?? "Đăng ký lại thất bại")
      }
    } catch {
      toast.error("Có lỗi xảy ra")
    }
  }

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải...</div>
  if (!registrations.length) return <div className="py-8 text-center text-gray-400">Không có sự kiện đã hủy.</div>

  return (
    <div className="space-y-3">
      {registrations.map((r: any) => {
        const deadlinePassed = r.activity?.registrationDeadline
          ? new Date() > new Date(r.activity.registrationDeadline)
          : false
        return (
          <div key={r.registrationId} className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <Link href={`/event/${r.activity?.activityId}`} className="font-medium text-[#05566B] hover:underline">
                {r.activity?.activityName ?? "—"}
              </Link>
              <div className="text-sm text-gray-500">{r.activity?.organization?.organizationName}</div>
              <div className="text-sm text-gray-500">Bắt đầu: {formatDate(r.activity?.startTime)}</div>
            </div>
            {!deadlinePassed && (
              <Button
                size="sm"
                className="bg-[#05566B] text-white hover:bg-[#056382]"
                onClick={() => handleReRegister(
                  r.activity?.activityId,
                  r.activity?.maxParticipants ?? null,
                  r.activity?._count?.registrations ?? 0
                )}
              >
                Đăng ký lại
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: CLB đã tham gia ────────────────────────────────────────────────────
function JoinedClubsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-organizations"],
    queryFn: () => http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/users/me/organizations`),
  })
  const memberships = (data as any)?.data ?? []

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải...</div>
  if (!memberships.length) return <div className="py-8 text-center text-gray-400">Chưa tham gia CLB nào.</div>

  return (
    <div className="space-y-3">
      {memberships.map((m: any) => (
        <Link key={m.organizationId} href={`/club/${m.organization?.organizationId}`}>
          <div className="flex items-center gap-4 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {m.organization?.logoUrl && (
                <img src={m.organization.logoUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="font-medium text-[#05566B]">{m.organization?.organizationName}</div>
              <div className="text-sm text-gray-500">Vai trò: {m.role ?? "Thành viên"}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── Tab: CLB đã nộp đơn ─────────────────────────────────────────────────────
function AppliedClubsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/club-applications/my`),
  })
  const applications = (data as any)?.data?.data ?? []

  if (isLoading) return <div className="py-8 text-center text-gray-400">Đang tải...</div>
  if (!applications.length) return <div className="py-8 text-center text-gray-400">Chưa nộp đơn CLB nào.</div>

  return (
    <div className="space-y-3">
      {applications.map((app: any) => (
        <div key={app.applicationId} className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <div className="font-medium text-[#05566B]">
              {app.activity?.organization?.organizationName ?? "—"}
            </div>
            <div className="text-sm text-gray-500">
              Ngày nộp: {formatDate(app.submittedAt)}
            </div>
          </div>
          <Badge variant={APPLICATION_RESULT_VARIANT[app.result] ?? "secondary"}>
            {APPLICATION_RESULT_LABEL[app.result] ?? app.result}
          </Badge>
        </div>
      ))}
    </div>
  )
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [pendingAvatarKey, setPendingAvatarKey] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
  })

  const user = data?.data?.user

  return (
    <div className="w-full mt-[20px] px-[30px] space-y-4">
      {/* Avatar + tên */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-[10px]">
            <ImageUpload
              folder="avatars"
              variant="avatar"
              currentImageUrl={user?.avatarUrl ?? "/hinh-nen-may-tinh-anime.jpg"}
              onUpload={setPendingAvatarKey}
            />
            <div>
              <h2 className="text-lg font-semibold">{isLoading ? "..." : (user?.userName ?? "—")}</h2>
              <div className="text-sm text-gray-500">{isLoading ? "..." : (user?.email ?? "—")}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 3 tabs chính */}
      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="events">Sự kiện của tôi</TabsTrigger>
          <TabsTrigger value="clubs">Lịch sử CLB</TabsTrigger>
        </TabsList>

        {/* Tab 1: Hồ sơ */}
        <TabsContent value="profile">
          <Card>
            <ProfileForm user={user} isLoading={isLoading} pendingAvatarKey={pendingAvatarKey} />
          </Card>
        </TabsContent>

        {/* Tab 2: Sự kiện của tôi */}
        <TabsContent value="events">
          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="registered">
                <TabsList>
                  <TabsTrigger value="registered">Đã đăng ký</TabsTrigger>
                  <TabsTrigger value="attended">Đã tham gia</TabsTrigger>
                  <TabsTrigger value="waitlist">Phòng chờ</TabsTrigger>
                  <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
                </TabsList>
                <TabsContent value="registered"><RegisteredTab /></TabsContent>
                <TabsContent value="attended"><AttendedTab /></TabsContent>
                <TabsContent value="waitlist"><WaitlistTab /></TabsContent>
                <TabsContent value="cancelled"><CancelledTab /></TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Lịch sử CLB */}
        <TabsContent value="clubs">
          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="joined">
                <TabsList>
                  <TabsTrigger value="joined">CLB đã tham gia</TabsTrigger>
                  <TabsTrigger value="applied">CLB đã nộp đơn</TabsTrigger>
                </TabsList>
                <TabsContent value="joined"><JoinedClubsTab /></TabsContent>
                <TabsContent value="applied"><AppliedClubsTab /></TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
