"use client"

import { useState } from "react";
import { SafeImage } from "@/components/ui-custom/SafeImage";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationById, getOrganizationMembers } from "@/services/organization.service";

const ROLE_LABELS_CLUB: Record<string, string> = {
  president:          "Chủ nhiệm",
  vice_president:     "Phó chủ nhiệm",
  head_of_department: "Trưởng ban",
  vice_head:          "Phó ban",
  member:             "Thành viên",
};

const ROLE_LABELS_ORG: Record<string, string> = {
  president:          "Trưởng ban tổ chức",
  vice_president:     "Phó ban tổ chức",
  head_of_department: "Trưởng ban",
  vice_head:          "Phó ban",
  member:             "Thành viên",
};

function getRoleLabel(role: string, orgType: string | null | undefined): string {
  const map = orgType === "club" ? ROLE_LABELS_CLUB : ROLE_LABELS_ORG;
  return map[role] ?? role;
}

export default function ClubMemberPage() {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");

  const { data: orgDetail } = useQuery({
    queryKey: ["organization", id],
    queryFn: () => getOrganizationById(id),
    enabled: !!id,
  });
  const orgType = orgDetail?.data?.organizationType ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["org-members", id],
    queryFn: () => getOrganizationMembers(id),
    enabled: !!id,
  });

  // Backend trả: { success: true, data: { data: [], meta: {} } }
  const allMembers = data?.data?.data ?? [];

  const members = search.trim()
    ? allMembers.filter((m) => {
        const q = search.toLowerCase()
        return (
          m.user.userName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q) ||
          getRoleLabel(m.role ?? "", orgType).toLowerCase().includes(q)
        )
      })
    : allMembers;

  return (
    <div className="px-[40px] py-[30px]">
      <div className="mb-[20px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tên, email, vai trò"
          className="w-[300px] px-4 py-2 rounded-full bg-gray-100 outline-none"
        />
      </div>

      <h1 className="text-center text-[#1A73E8] text-[20px] font-bold mb-[20px]">
        DANH SÁCH THÀNH VIÊN CLB
      </h1>

      <div className="bg-[#E5E7EB] rounded-[10px] p-[20px]">
        <div className="grid grid-cols-4 font-bold mb-[10px]">
          <div>HỌ TÊN</div>
          <div>EMAIL</div>
          <div>NGÀY THAM GIA</div>
          <div>VAI TRÒ</div>
        </div>

        {isLoading && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 items-center py-3 border-t animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-[40px] h-[40px] rounded-full bg-gray-300" />
                <div className="h-3 bg-gray-300 rounded w-24" />
              </div>
              <div className="h-3 bg-gray-300 rounded w-32" />
              <div className="h-3 bg-gray-300 rounded w-20" />
              <div className="h-3 bg-gray-300 rounded w-16" />
            </div>
          ))
        )}

        {!isLoading && members.length === 0 && (
          <div className="text-center py-8 text-gray-500">Chưa có thành viên nào.</div>
        )}

        {!isLoading && members.map((m) => (
          <div
            key={`${m.userId}-${m.organizationId}`}
            className="grid grid-cols-4 items-center py-3 border-t"
          >
            <div className="flex items-center gap-3">
              <SafeImage
                src={m.user.avatarUrl ?? "/hinh-nen-may-tinh-anime.jpg"}
                alt={m.user.userName}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <span>{m.user.userName}</span>
            </div>
            <div>{m.user.email}</div>
            <div>
              {m.joinDate
                ? new Date(m.joinDate).toLocaleDateString("vi-VN")
                : "—"}
            </div>
            <div className="font-semibold">
              {getRoleLabel(m.role ?? "", orgType) || "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-[20px] gap-3">
        <button>{"< Trước"}</button>
        <button className="font-bold">1</button>
        <button>{"Tiếp theo >"}</button>
      </div>
    </div>
  );
}
