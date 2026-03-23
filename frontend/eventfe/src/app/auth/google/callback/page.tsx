"use client"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Suspense } from "react"
import { http } from "@/configs/http.comfig"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error || !code) {
      toast.error("Đăng nhập Google thất bại")
      router.replace("/auth/login")
      return
    }

    const exchange = async () => {
      const res = await http.post("/api/auth/google/exchange", { code }) as any

      if (!res?.success) {
        toast.error("Đăng nhập Google thất bại")
        router.replace("/auth/login")
        return
      }

      const role = res.user?.role ?? "student"
      toast.success("Đăng nhập thành công")

      if (role === "admin") {
        router.replace("/admin")
      } else if (role === "organization_leader") {
        router.replace("/organization")
      } else {
        router.replace("/")
      }
    }

    exchange()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Đang xử lý đăng nhập...</p>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  )
}
