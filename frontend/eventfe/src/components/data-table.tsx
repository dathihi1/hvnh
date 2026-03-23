"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentTable } from "./ui-custom/table/user-table"
import { ClubTable } from "./ui-custom/table/club-table"
import { envConfig } from "@/configs/env.config"
import { http } from "@/configs/http.comfig"
import React from "react"

export function DataTable() {
  const [users, setUsers] = React.useState<any[]>([])
  const [orgs, setOrgs] = React.useState<any[]>([])

  async function fetchUsers() {
    const res = await http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/admin/users?limit=100`) as any
    if (res?.success && res?.data?.data) {
      setUsers(res.data.data.map((u: any) => ({ ...u, id: u.userId })))
    }
  }

  async function fetchOrgs() {
    const res = await http.get<any>(`${envConfig.NEXT_PUBLIC_API_URL}/admin/organizations?limit=100`) as any
    if (res?.success && res?.data?.data) {
      setOrgs(res.data.data.map((o: any) => ({ ...o, id: o.organizationId })))
    }
  }

  React.useEffect(() => {
    fetchUsers()
    fetchOrgs()
  }, [])

  return (
    <Tabs defaultValue="student" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center px-4 lg:px-6 justify-between">
        <TabsList>
          <TabsTrigger value="student">Tài khoản</TabsTrigger>
          <TabsTrigger value="club">Tổ chức</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="student">
        <StudentTable data={users} onRefresh={fetchUsers} />
      </TabsContent>
      <TabsContent value="club" className="px-4 lg:px-6">
        <ClubTable data={orgs} onRefresh={fetchOrgs} />
      </TabsContent>
    </Tabs>
  )
}
