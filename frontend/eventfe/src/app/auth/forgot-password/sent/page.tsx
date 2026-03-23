import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import BackButton from "@/components/ui-custom/back.ui.custom"
import Link from "next/link"

export default function ForgotPasswordSentPage() {
  return (
    <Card className="w-full sm:max-w-md mx-auto mt-[50px]">
      <CardHeader>
        <BackButton className="mb-[30px] w-[50px] h-[50px] rounded-full bg-[#ECECEC] flex items-center justify-center" />
        <CardTitle className="mb-[20px]">Kiểm tra email của bạn</CardTitle>
        <CardDescription className="text-[#989898]">
          Chúng tôi đã gửi link đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư đến.
        </CardDescription>
        <p className="text-sm mt-4">
          Chưa nhận được?{" "}
          <Link href="/auth/forgot-password" className="text-[#05566B] underline">
            Gửi lại
          </Link>
        </p>
      </CardHeader>
    </Card>
  )
}
