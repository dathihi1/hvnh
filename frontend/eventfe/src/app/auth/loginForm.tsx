"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { PasswordInput } from "@/components/ui-custom/password-input"
import { http } from "@/configs/http.comfig"
import { envConfig } from "@/configs/env.config"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Không đủ 8 kí tự"),
  rememberMe: z.boolean().default(false),
})

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const res = await http.post(`/api/auth/login`, data) as any

    if ("code" in res) {
      toast.error(res.message)
      return
    }

    toast.success("Đăng nhập thành công")
    onSuccess?.()
    const role = res.user?.role ?? "student"
    if (role === "admin") {
      router.push("/admin")
    } else if (role === "organization_leader") {
      router.push("/organization")
    } else {
      router.push("/")
    }
  }

  return (
    <>
      <CardContent>
        <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-[11px]">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-login-email">
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-login-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="ava.wright@gmail.com"
                    autoComplete="on"
                    type="email"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-login-password">
                    Password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="form-login-password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    className="h-[46px]"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Controller
                name="rememberMe"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="form-login-remember"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label htmlFor="form-login-remember" className="text-sm cursor-pointer select-none">
                Lưu mật khẩu
              </label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[#05566B]"
              onClick={() => onSuccess?.()}
            >
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="flex flex-col">
          <Button type="submit" form="form-login" className="w-[130px] h-[40px] bg-[#056382] hover:bg-[#056382] cursor-pointer">
            Login
          </Button>
          <Button
            type="button"
            onClick={() => { window.location.href = `${envConfig.NEXT_PUBLIC_API_URL}/auth/google` }}
            className="w-[327px] h-[48px] bg-white border border-[#EFF0F6] text-black shadow-[inset_0px_-3px_6px_0px_#F4F5FA99] hover:bg-white cursor-pointer"
          >
            Sign in with Google
          </Button>
        </Field>
      </CardFooter>
    </>
  )
}
