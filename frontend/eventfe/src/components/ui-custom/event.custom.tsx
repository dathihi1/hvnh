"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { DialogCustom, type FilterValues } from "@/components/ui-custom/dialog.custom"
import { EventCard } from "@/components/ui-custom/EventCard"
import { PaginationCustom } from "@/components/ui-custom/pagination.custom"
import Link from "next/link"
import { useState } from "react"
import { getActivities } from "@/services/activity.service"

interface EventCustomeProps {
  className?: string
  isFilter?: boolean
  activityType?: string
}

export function EventCustome({
  isFilter = true,
  activityType,
}: EventCustomeProps) {
  const searchParams = useSearchParams()
  const urlSearch = searchParams.get("search") ?? undefined
  const urlStatus = searchParams.get("status") ?? undefined
  const urlStartDate = searchParams.get("startDate") ?? undefined
  const urlEndDate = searchParams.get("endDate") ?? undefined
  const urlCategoryId = searchParams.get("categoryId") ?? undefined

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<FilterValues>({})

  const handleFilter = (newFilters: FilterValues) => {
    setFilters(newFilters)
    setPage(1)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["activities", page, activityType, filters, urlSearch, urlStatus, urlStartDate, urlEndDate, urlCategoryId],
    queryFn: () => getActivities({
      page,
      limit: 8,
      type: activityType,
      status: filters.status || urlStatus || "published",
      categoryId: filters.categoryId
        ? Number(filters.categoryId)
        : urlCategoryId ? Number(urlCategoryId) : undefined,
      startDate: filters.startDate || urlStartDate || undefined,
      endDate: filters.endDate || urlEndDate || undefined,
      search: urlSearch,
    }),
  })

  const activities = data?.data?.data ?? []
  const meta = data?.data?.meta

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-y-8 mb-[30px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="mx-auto w-[350px] h-[400px] bg-gray-100 rounded-[10px] animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-10 text-gray-500">
        Không thể tải danh sách sự kiện. Vui lòng thử lại.
      </div>
    )
  }

  return (
    <>
      {isFilter && (
        <DialogCustom
          className="mb-[20px]"
          onFilter={handleFilter}
        />
      )}
      <div className="grid grid-cols-4 gap-y-8 mb-[30px]">
        {activities.map((activity) => (
          <Link key={activity.activityId} href={`/event/${activity.activityId}`}>
            <EventCard activity={activity} />
          </Link>
        ))}
        {activities.length === 0 && (
          <div className="col-span-4 text-center py-10 text-gray-500">
            Chưa có sự kiện nào phù hợp.
          </div>
        )}
      </div>
      <PaginationCustom
        page={page}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </>
  )
}
