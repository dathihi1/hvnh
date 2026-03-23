"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SlideCustome } from "@/components/ui-custom/slide.custom"
import { EventCard } from "@/components/ui-custom/EventCard"
import { ClubCardItem } from "@/components/ui-custom/ClubCardItem.custome"
import { PaginationCustom } from "@/components/ui-custom/pagination.custom"
import Link from "next/link"
import { getActivities } from "@/services/activity.service"
import { getOrganizations } from "@/services/organization.service"

export default function Home() {
  const [eventsPage, setEventsPage] = useState(1)
  const [clubsPage, setClubsPage] = useState(1)

  // SỰ KIỆN SẮP DIỄN RA: chỉ hiển thị sự kiện trong vòng 1 tuần tới
  const now = new Date()
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: activitiesData, isLoading: loadingActivities } = useQuery({
    queryKey: ["activities-home", eventsPage],
    queryFn: () => getActivities({
      page: eventsPage,
      limit: 8,
      status: "published",
      startDate: now.toISOString(),
      endDate: oneWeekLater.toISOString(),
    }),
  })

  const { data: orgsData, isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations-clubs-recruiting", clubsPage],
    queryFn: () => getOrganizations({ page: clubsPage, limit: 8, type: "club" }),
  })

  const activities = activitiesData?.data?.data ?? []
  const activitiesMeta = activitiesData?.data?.meta
  const organizations = orgsData?.data?.data ?? []
  const orgsMeta = orgsData?.data?.meta

  return (
    <div className="space-y-[30px]">
      <SlideCustome />

      <div>
        <h1 className="text-[#05566B] text-center mb-[30px] text-[28px] font-bold">
          SỰ KIỆN SẮP DIỄN RA
        </h1>
        {loadingActivities ? (
          <div className="grid grid-cols-4 gap-y-8 px-4 mb-[30px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mx-auto w-[350px] h-[400px] bg-gray-100 rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-y-8 px-4 mb-[30px]">
            {activities.map((activity) => (
              <Link key={activity.activityId} href={`/event/${activity.activityId}`}>
                <EventCard activity={activity} />
              </Link>
            ))}
            {activities.length === 0 && (
              <div className="col-span-4 text-center py-10 text-gray-500">
                Chưa có sự kiện nào.
              </div>
            )}
          </div>
        )}
        <PaginationCustom
          page={eventsPage}
          totalPages={activitiesMeta?.totalPages ?? 1}
          onPageChange={setEventsPage}
        />
      </div>

      <div>
        <h1 className="text-[#05566B] text-center mb-[30px] text-[28px] font-bold">
          TUYỂN THÀNH VIÊN
        </h1>
        {loadingOrgs ? (
          <div className="grid grid-cols-2 justify-items-center gap-y-[20px] mb-[30px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-5">
                <div className="w-[100px] h-[100px] rounded-full bg-gray-100 animate-pulse" />
                <div className="space-y-2">
                  <div className="w-40 h-4 bg-gray-100 animate-pulse rounded" />
                  <div className="w-32 h-3 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 justify-items-center gap-y-[20px] mb-[30px]">
            {organizations.map((org) => (
              <ClubCardItem key={org.organizationId} organization={org} />
            ))}
            {organizations.length === 0 && (
              <div className="col-span-2 text-center py-10 text-gray-500">
                Chưa có câu lạc bộ nào.
              </div>
            )}
          </div>
        )}
        <PaginationCustom
          page={clubsPage}
          totalPages={orgsMeta?.totalPages ?? 1}
          onPageChange={setClubsPage}
        />
      </div>
    </div>
  )
}
