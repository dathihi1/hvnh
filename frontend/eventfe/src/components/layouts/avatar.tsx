"use client"
import { BadgeCheckIcon, ClipboardClock, LogOutIcon, Rows2, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { http } from "@/configs/http.comfig";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function UserMenu({
  className,
  isOrganization = false
}: {
  className?: string
  isOrganization?: boolean
}) {
  const router = useRouter()

  async function logout() {
    const res: any = await http.post(`/api/auth/logout`, undefined)

    if (!res || res.code) {
      toast.error(res?.message ?? 'Logout thất bại')
      return
    }

    router.push('/auth')
    toast.success('Đăng xuất thành công')
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="" >
        <Avatar className="w-[40px] h-[40px]">
          <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[99999]">
       <DropdownMenuGroup>
        {!isOrganization && (
          <>
            <DropdownMenuItem>
              <User />
              <Link href="/profile">Account</Link>
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Rows2 />
              <Link href="/my-events">Sự kiện của tôi</Link>
            </DropdownMenuItem>

            <DropdownMenuItem>
              <ClipboardClock />
              <Link href="/history-club">Lịch sử CLB</Link>
            </DropdownMenuItem>
          </>
        )}

        {isOrganization && (
          <DropdownMenuItem>
            <User />
            <Link href="/organization/profile">Hồ sơ</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}