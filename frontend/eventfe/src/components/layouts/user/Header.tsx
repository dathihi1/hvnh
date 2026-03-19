import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "../avatar";
import { navigationConfig } from "@/configs/navigation";

export async function Header({ isClub = false }: { isClub?: boolean }) {
  return (
    <header className="bg-[#05566B] flex items-center justify-between sticky top-0 w-full z-[999]">
      <Link href={isClub ? "/organization" : "/"} className="ml-[180px] mr-[50px]">
        <Image width={59} height={59} alt="Logo" src="/logoheader.png" />
      </Link>
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
            <Link href="/" className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
              Cuộc Thi
            </Link>
            <Link href="/" className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] transition-colors hover:bg-teal-700 rounded-[8px]">
              Chương Trình
            </Link>
          </div>
        </div>
        <div className="relative group">
          {isClub ? (
            <div className="relative group">
              <div className="text-white uppercase font-bold tracking-wider text-[13px] px-6 py-6 flex items-center gap-2 cursor-pointer">
                Quản lý
                <ChevronDown className="group-hover:rotate-180 transition-transform duration-200" />
              </div>

              <div className="absolute top-[60px] left-0 bg-[#05566B] hidden group-hover:block shadow-lg z-50 w-[250px] rounded-[8px]">
                <Link
                  href="/organization/club/info"
                  className="block px-6 py-4 text-white uppercase font-bold tracking-wider text-[13px] hover:bg-teal-700 rounded-[8px]"
                >
                  Thông tin CLB
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
        <div className="relative bg-white rounded-[50px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            placeholder="Search"
            className="pl-9 bg-transparent border-white/30 w-[200px] rounded-full"
          />
        </div>
        <UserMenu isOrganization={isClub} />
        <Image width={25} height={29} alt="Logo" src="/bell.svg" />
      </div>
    </header>
  )
}