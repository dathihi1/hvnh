"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthModalProvider } from "@/contexts/auth-modal.context";
import { AuthModal } from "@/components/ui-custom/auth-modal";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    return new QueryClient({
      defaultOptions: {
      }
    })
  })
  return (
    <QueryClientProvider client={queryClient}>
      <AuthModalProvider>
        {children}
        <AuthModal />
      </AuthModalProvider>
    </QueryClientProvider>
  )
}