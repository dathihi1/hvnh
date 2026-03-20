"use client"

import { BannerCustom } from "@/components/ui-custom/banner.custom"
import { DialogCustom } from "@/components/ui-custom/dialog.custom"
import { EventCard } from "@/components/ui-custom/EventCard"
import { PaginationCustom } from "@/components/ui-custom/pagination.custom"
import { getMyRegistrations } from "@/services/registration.service"
import { useQuery } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Activity } from "@/services/activity.service"

export default function MyEventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => getMyRegistrations(),
  })

  // Backend: { success: true, data: { data: Registration[], meta: {} } }
  const registrations = (data as any)?.data?.data ?? (data as any)?.data ?? []

  // Map registration.activity to Activity shape for EventCard
  const activities: Activity[] = registrations
    .filter((r: any) => r.activity)
    .map((r: any) => ({
      activityId: r.activity.activityId,
      activityName: r.activity.activityName,
      activityStatus: r.activity.activityStatus,
      activityType: r.activity.activityType ?? "",
      startTime: r.activity.startTime ?? null,
      endTime: r.activity.endTime ?? null,
      registrationDeadline: null,
      maxParticipants: null,
      coverImage: r.activity.coverImage ?? null,
      category: null,
      organization: r.activity.organization ?? null,
      _count: { registrations: 0 },
    }))

  return (
    <>
      <div className="pb-[20px]">
        <BannerCustom className="mb-[30px] p-[10px]">
          <Link href='/' className="">
            Trang chủ
          </Link>
          <ChevronRight className="inline-block size-[18px]" />
          <Link href='/my-events' className="">
            Sự kiện của tôi
          </Link>
        </BannerCustom>
        <DialogCustom className="mb-[20px] ml-[30px]" onFilter={() => {}} />
        <div className="grid grid-cols-4 gap-y-8 px-4 mb-[30px]">
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mx-auto w-[350px] h-[400px] bg-gray-100 rounded-[10px] animate-pulse" />
          ))}
          {!isLoading && activities.map((activity) => (
            <Link key={activity.activityId} href={`/event/${activity.activityId}`}>
              <EventCard activity={activity} />
            </Link>
          ))}
          {!isLoading && activities.length === 0 && (
            <div className="col-span-4 text-center py-10 text-gray-500">Bạn chưa đăng ký sự kiện nào.</div>
          )}
        </div>
        <PaginationCustom />
      </div>
    </>
  )
}
