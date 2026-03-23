"use client"
import Image from "next/image"
import { VisuallyHidden } from "radix-ui"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardHeader } from "@/components/ui/card"
import { LoginForm } from "@/app/auth/loginForm"
import { RegisterForm } from "@/app/auth/registerForm"
import { useAuthModal } from "@/contexts/auth-modal.context"

export function AuthModal() {
  const { isOpen, close } = useAuthModal()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="py-6 px-0 max-w-md w-full overflow-y-auto max-h-[90vh] z-[1000]">
        <VisuallyHidden.Root>
          <DialogTitle>Đăng nhập / Đăng ký</DialogTitle>
        </VisuallyHidden.Root>
        <Tabs defaultValue="login">
          <CardHeader>
            <Image src="/logo.png" alt="Logo" width={120} height={120} className="mx-auto mb-[10px]" />
            <TabsList variant="line" className="mx-auto">
              <TabsTrigger value="login" className="text-[20px] w-[169px]">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-[20px] w-[169px]">Sign up</TabsTrigger>
            </TabsList>
          </CardHeader>
          <hr className="border-t-2 border-white w-full" />
          <TabsContent value="login">
            <LoginForm onSuccess={close} />
          </TabsContent>
          <TabsContent value="signup">
            <RegisterForm onSuccess={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
