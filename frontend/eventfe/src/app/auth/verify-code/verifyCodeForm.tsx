"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
} from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { http } from "@/configs/http.comfig"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  otp: z.string().length(6, "Mã OTP phải có 6 chữ số"),
})

interface Props {
  userId: number
  email: string
}

export function VerifyCodeForm({ userId, email }: Props) {
  const router = useRouter()
  const [resending, setResending] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const res = await http.post("/api/auth/verify-otp", { userId, otp: data.otp }) as any

    if (!res?.success) {
      toast.error(res?.message || "Mã OTP không đúng hoặc đã hết hạn")
      form.reset()
      return
    }

    toast.success("Xác thực thành công! Vui lòng đăng nhập để tiếp tục.")
    router.push("/auth")
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return
    setResending(true)

    const res = await http.post("/api/auth/resend-otp", { email }) as any
    setResending(false)

    if (!res?.success) {
      toast.error(res?.message || "Không thể gửi lại OTP")
      return
    }

    toast.success("Mã OTP mới đã được gửi đến email của bạn")
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <>
      <CardContent>
        <form id="form-verify" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-[11px]">
            <Controller
              name="otp"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="text-center">
                  <InputOTP
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="form-verify-otp"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                  >
                    <InputOTPGroup className="mx-auto">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="flex flex-col gap-3">
          <Button
            type="submit"
            form="form-verify"
            className="w-[130px] h-[40px] bg-[#056382] hover:bg-[#056382] cursor-pointer"
          >
            Xác thực
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-[14px] text-[#056382] disabled:text-[#989898] cursor-pointer disabled:cursor-not-allowed"
          >
            {cooldown > 0
              ? `Gửi lại sau ${cooldown}s`
              : resending
              ? "Đang gửi..."
              : "Chưa nhận được? Gửi lại"}
          </button>
        </Field>
      </CardFooter>
    </>
  )
}
