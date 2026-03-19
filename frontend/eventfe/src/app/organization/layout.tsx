import { Header } from "@/components/layouts/user/Header"
import { Footer } from "@/components/layouts/user/Footer";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header isClub />
      <main>{children}</main>
      <Footer />
    </>
  )
}