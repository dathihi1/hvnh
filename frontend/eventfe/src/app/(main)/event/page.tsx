"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BannerCustom } from "@/components/ui-custom/banner.custom"
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
      <div className="flex justify-between items-center mb-[20px]">
        <BannerCustom className="mb-0 p-[10px]">
          {title}
        </BannerCustom>
      </div>
      <EventCustome activityType={type} />
    </div>
  )
}

export default function EventPage() {
  return (
    <Suspense fallback={<div className="pb-[20px]" />}>
      <EventContent />
    </Suspense>
  )
}
