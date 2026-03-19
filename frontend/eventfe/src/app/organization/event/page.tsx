import { BannerCustom } from "@/components/ui-custom/banner.custom";
import { DialogCustom } from "@/components/ui-custom/dialog.custom";
import { EventCustome } from "@/components/ui-custom/event.custom";
import { EventCard } from "@/components/ui-custom/EventCard";
import { PaginationCustom } from "@/components/ui-custom/pagination.custom";
import Link from "next/link";

export default function EventPage() {
  return (
    <>
        <div className="flex justify-between items-start mb-[20px]">
            <BannerCustom className="mb-0 p-[10px] w-auto">
                TẤT CẢ SỰ KIỆN
            </BannerCustom>
            <div className="flex flex-col gap-2">
                <Link href="/organization/create-program">
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                Tạo mới chương trình
                </button>
            </Link>

            <Link href="/organization/create-contest">
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                Tạo mới cuộc thi
                </button>
            </Link>
            </div>
        </div>
        <EventCustome/>
    </>
  )
}