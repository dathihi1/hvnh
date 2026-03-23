"use client"
import { Building2, ClipboardClock, Home, LogOutIcon, Rows2, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { http } from "@/configs/http.comfig"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getMe } from "@/services/auth.service"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { useAuthModal } from "@/contexts/auth-modal.context"

export function UserMenu({
  className,
  isOrganization = false
}: {
  className?: string
  isOrganization?: boolean
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { open } = useAuthModal()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const hasToken = mounted && document.cookie.includes("access_token=")

  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: hasToken,
  })

  const user = data?.data?.user
  const isOrgLeader = user?.roles?.includes("organization_leader") || user?.roles?.includes("club")
  const initials = user?.userName
    ? user.userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  async function logout() {
    const res: any = await http.post(`/api/auth/logout`, {})

    if (!res?.success) {
      toast.error(res?.message ?? "Đăng xuất thất bại")
      return
    }

    // Clear all cached data
    queryClient.clear()
    localStorage.clear()
    sessionStorage.clear()

    router.push("/")
    toast.success("Đăng xuất thành công")
  }

  if (!mounted) return <div className="w-[40px] h-[40px]" />

  if (!hasToken || !user) {
    return (
      <Button
        onClick={open}
        className="bg-white text-[#05566B] hover:bg-white/90 font-semibold px-5 h-[38px] rounded-full"
      >
        Đăng nhập
      </Button>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="">
        <Avatar className="w-[40px] h-[40px]">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.userName ?? "Người dùng"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[99999]">
        <DropdownMenuGroup>
          {!isOrganization && (
            <>
              <DropdownMenuItem>
                <User />
                <Link href="/profile">Tài khoản</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Rows2 />
                <Link href="/my-events">Sự kiện của tôi</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ClipboardClock />
                <Link href="/history-club">Lịch sử CLB</Link>
              </DropdownMenuItem>
              {isOrgLeader && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Building2 />
                    <Link href="/organization">
                      {user?.roles?.includes("club") ? "Quản lý câu lạc bộ" : "Quản lý Tổ chức"}
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
          {isOrganization && (
            <>
              <DropdownMenuItem>
                <User />
                <Link href="/organization/profile">Hồ sơ tổ chức</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Rows2 />
                <Link href="/organization/event">Quản lý sự kiện</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Home />
                <Link href="/">Trang chính</Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOutIcon />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
