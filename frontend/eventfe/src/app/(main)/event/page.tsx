"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { EventCustome } from "@/components/ui-custom/event.custom"

const TYPE_LABELS: Record<string, string> = {
  competition: "CUỘC THI",
  program: "CHƯƠNG TRÌNH",
  recruitment: "TUYỂN THÀNH VIÊN",
}

function EventContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") ?? undefined
  const title = type ? TYPE_LABELS[type] ?? "TẤT CẢ SỰ KIỆN" : "TẤT CẢ SỰ KIỆN"

  return (
    <div className="pb-[20px]">
      <div className="px-[60px]">
        <EventCustome activityType={type} />
      </div>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="pb-[20px]">
      <div className="px-[60px]">
        <div className="grid grid-cols-4 gap-y-8 mb-[30px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mx-auto w-[350px] h-[400px] bg-gray-100 rounded-[10px] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function EventPage() {
  return (
    <Suspense fallback={<EventSkeleton />}>
      <EventContent />
    </Suspense>
  )
}
