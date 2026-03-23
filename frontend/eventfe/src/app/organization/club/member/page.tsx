"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { getMyOrganization, getOrganizationMembers, removeMember } from "@/services/organization.service";

const ROLE_LABELS_CLUB: Record<string, string> = {
  president: "Chủ nhiệm",
  vice_president: "Phó chủ nhiệm",
  head_of_department: "Trưởng ban",
  vice_head: "Phó ban",
  member: "Thành viên",
};

const ROLE_LABELS_ORG: Record<string, string> = {
  president: "Trưởng ban tổ chức",
  vice_president: "Phó ban tổ chức",
  head_of_department: "Trưởng ban",
  vice_head: "Phó ban",
  member: "Thành viên",
};

function getRoleLabel(role: string, orgType: string | null | undefined): string {
  const map = orgType === "club" ? ROLE_LABELS_CLUB : ROLE_LABELS_ORG;
  return map[role] ?? role;
}

export default function ClubMemberPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const pageSize = 10;
  const debouncedSearch = useDebounce(search, 400);

  const { data: orgData } = useQuery({
    queryKey: ["my-organization"],
    queryFn: getMyOrganization,
  });
  const orgId = orgData?.data?.organizationId;
  const orgType = orgData?.data?.organizationType ?? null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["org-members", orgId, page, debouncedSearch],
    queryFn: () => getOrganizationMembers(orgId!, { page, limit: pageSize, search: debouncedSearch || undefined }),
    enabled: !!orgId,
  });

  const members = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const removeMut = useMutation({
    mutationFn: (userId: number) => removeMember(orgId!, userId),
    onSuccess: () => {
      toast.success("Đã xóa thành viên");
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      setOpenConfirm(false);
    },
    onError: () => {
      toast.error("Xóa thành viên thất bại");
      setOpenConfirm(false);
    },
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="px-10 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#1A73E8] font-bold text-xl">DANH SÁCH THÀNH VIÊN</h1>

        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm theo tên, email, mssv..."
          className="px-4 py-2 rounded-full bg-gray-100 outline-none w-[280px]"
        />
      </div>

      <div className="bg-[#e6eaf3] p-4 rounded-xl space-y-3 min-h-[200px]">
        {isLoading && (
          <div className="text-center text-gray-500 py-8">Đang tải...</div>
        )}
        {isError && (
          <div className="text-center text-red-500 py-8">Không thể tải danh sách thành viên</div>
        )}
        {!isLoading && !isError && members.length === 0 && (
          <div className="text-center text-gray-500 py-8">Không có thành viên nào</div>
        )}
        {members.map((m) => (
          <div
            key={m.userId}
            className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_1fr] items-center bg-white px-4 py-3 rounded-lg text-sm min-w-0 gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {m.user?.avatarUrl ? (
                <Image
                  src={m.user.avatarUrl}
                  alt="avatar"
                  width={35}
                  height={35}
                  className="rounded-full shrink-0 object-cover"
                />
              ) : (
                <div className="w-[35px] h-[35px] rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">
                  {m.user?.userName?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
              <span className="truncate">{m.user?.userName ?? "—"}</span>
            </div>

            <div className="truncate text-gray-600">{m.user?.email ?? "—"}</div>

            <div className="text-gray-600">{m.user?.studentId ?? "—"}</div>

            <div className="text-gray-600">
              {m.joinDate ? new Date(m.joinDate).toLocaleDateString("vi-VN") : "—"}
            </div>

            <div className="text-gray-700 font-medium">{getRoleLabel(m.role ?? "member", orgType)}</div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setSelectedUserId(m.userId);
                  setOpenConfirm(true);
                }}
                className="w-[80px] bg-red-500 text-white py-1 rounded-full text-xs hover:bg-red-600"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="disabled:text-gray-300"
          >
            {"< Trước"}
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 rounded ${page === i + 1 ? "bg-[#08667a] text-white" : ""}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="disabled:text-gray-300"
          >
            {"Tiếp theo >"}
          </button>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <div className="text-[#1A73E8] font-bold uppercase">
          TỔNG SỐ THÀNH VIÊN: {total}
        </div>
      </div>

      {openConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Bạn có chắc muốn xóa thành viên này?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-300"
              >
                Hủy
              </button>
              <button
                disabled={removeMut.isPending}
                onClick={() => {
                  if (selectedUserId !== null) removeMut.mutate(selectedUserId);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-60"
              >
                {removeMut.isPending ? "Đang xóa..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
