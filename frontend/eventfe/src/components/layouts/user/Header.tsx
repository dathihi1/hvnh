"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "../avatar";
import { NotificationBell } from "@/components/ui-custom/NotificationBell";
import { OrgBrand } from "../OrgBrand";
import { HeaderSearchBar } from "@/components/ui-custom/HeaderSearchBar";
import { useQuery } from "@tanstack/react-query";
import { getMyOrganization } from "@/services/organization.service";

export function Header({ isClub = false }: { isClub?: boolean }) {
  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: getMyOrganization,
    enabled: isClub,
    staleTime: 5 * 60 * 1000,
  });
  const orgType = orgData?.data?.organizationType ?? null;
  const isClubType = !orgType || orgType === "club";
  return (
    <header className="bg-[#05566B] flex items-center justify-between sticky top-0 w-full z-[999]">
      {isClub ? (
        <OrgBrand />
      ) : (
        <Link href="/" className="ml-[180px] mr-[50px]">
          <Image width={59} height={59} alt="Logo" src="/logoheader.png" />
        </Link>
      )}
      <nav className="ml-4 flex items-center gap-[40px] justify-center">
        <Link href={isClub ? "/organization" : "/"} className="text-white uppercase font-bold tracking-wider text-[13px] px-6 py-6 transition-colors block ">
          Trang chủ
        </Link>
        <div className="relative group">
          <Link href={isClub ? "/organization/event" : "/event"} className="text-white uppercase font-bold tracking-wider text-[13px] px-6 py-6 transition-colors flex items-center gap-2 cursor-pointer  justify-between">
            Sự Kiện
            <ChevronDown className="group-hover:rotate-180 transition-transform duration-200 inline-block" />
          </Link>
          <div className="absolute top-[60px] left-0 bg-[#05566B] hidden group-hover:block shadow-lg z-50 w-[250px] rounded-[8px]">
            <Link href={isClub ? "/organization/event" : "/event"} className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
              Tất Cả Sự Kiện
            </Link>
            <Link href={isClub ? "/organization/event?type=competition" : "/event?type=competition"} className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
              Cuộc Thi
            </Link>
            <Link href={isClub ? "/organization/event?type=program" : "/event?type=program"} className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
              Chương Trình
            </Link>
            {isClub && (
              <>
                <div className="border-t border-teal-600 mx-4 my-1" />
                <Link href="/organization/create-program" className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
                  + Tạo Mới Chương Trình
                </Link>
                <Link href="/organization/create-contest" className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
                  + Tạo Mới Cuộc Thi
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="relative group">
          {isClub ? (
            <div className="relative group">
              <div className="text-white uppercase font-bold tracking-wider text-[13px] px-6 py-6 flex items-center gap-2 cursor-pointer">
                {isClubType ? "Quản lý câu lạc bộ" : "Quản lý tổ chức"}
                <ChevronDown className="group-hover:rotate-180 transition-transform duration-200" />
              </div>

              <div className="absolute top-[60px] left-0 bg-[#05566B] hidden group-hover:block shadow-lg z-50 w-[250px] rounded-[8px]">
                <Link
                  href="/organization/club/info"
                  className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] hover:bg-teal-700 rounded-[8px]"
                >
                  {isClubType ? "Thông tin CLB" : "Thông tin tổ chức"}
                </Link>

                <Link
                  href="/organization/club/member"
                  className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] hover:bg-teal-700 rounded-[8px]"
                >
                  Thành viên
                </Link>

                <Link
                  href="/organization/club/candidate"
                  className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] hover:bg-teal-700 rounded-[8px]"
                >
                  Ứng viên
                </Link>

                <Link
                  href="/organization/forms"
                  className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] hover:bg-teal-700 rounded-[8px]"
                >
                  Biểu mẫu
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/club"
              className="text-white uppercase font-bold tracking-wider text-[13px] px-6 py-6 transition-colors"
            >
              Câu lạc bộ
            </Link>
          )}
        </div>
        <Link href={isClub ? "/organization/contact" : "/contact"} className='text-white uppercase font-bold tracking-wider text-[13px] px-6 py-6 transition-colors'>Liên hệ</Link>
      </nav>
      <div className="flex gap-[40px] pr-[30px] items-center">
        <HeaderSearchBar />
        <UserMenu isOrganization={isClub} />
        <NotificationBell />
      </div>
    </header>
  )
}