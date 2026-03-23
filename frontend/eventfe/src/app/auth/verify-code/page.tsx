import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import BackButton from "@/components/ui-custom/back.ui.custom"
import { VerifyCodeForm } from "./verifyCodeForm"

interface Props {
  searchParams: Promise<{ userId?: string; email?: string }>
}

export default async function VerifyCodePage({ searchParams }: Props) {
  const { userId, email } = await searchParams

  return (
    <Card className="w-full sm:max-w-md mx-auto mt-[50px]">
      <CardHeader>
        <BackButton className="mb-[30px] w-[50px] h-[50px] rounded-full bg-[#ECECEC] flex items-center justify-center" />
        <CardTitle className="mb-[20px]">Xác thực email</CardTitle>
        <CardDescription className="text-[#989898]">
          Chúng tôi đã gửi mã OTP 6 chữ số đến{" "}
          <span className="font-medium text-[#056382]">{email ?? "email của bạn"}</span>.
          Vui lòng nhập mã để kích hoạt tài khoản.
        </CardDescription>
      </CardHeader>
      <VerifyCodeForm userId={Number(userId)} email={email ?? ""} />
    </Card>
  )
}
