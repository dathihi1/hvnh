"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  getRegistrationsByActivity,
  getActivityStats,
  updateRegistrationStatus,
  bulkUpdateRegistrationStatus,
  type RegistrationDetailExtended,
} from "@/services/registration.service";
import { PaginationCustom } from "@/components/ui-custom/pagination.custom";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

const STATUS_TABS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đã duyệt", value: "approved" },
  { label: "Chờ danh sách", value: "waiting" },
  { label: "Check-in", value: "checkin" },
  { label: "Check-out", value: "checkout" },
] as const;

type TabValue = (typeof STATUS_TABS)[number]["value"];

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
  if (src)
    return (
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        className="rounded-full object-cover w-9 h-9 shrink-0"
      />
    );
  return (
    <div className="w-9 h-9 rounded-full bg-[#08667a] text-white flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    waiting: "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    cancelled: "Đã huỷ",
    waiting: "Danh sách chờ",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {labels[status] ?? status}
    </span>
  );
}

const QUERY_KEY = (id: string, page: number, tab: string, search: string) =>
  ["participants", id, page, tab, search];

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const search = useDebounce(searchInput, 400);

  const isCheckinTab = tab === "checkin" || tab === "checkout";
  const statusParam = isCheckinTab ? undefined : tab || undefined;
  const checkinStatusParam = isCheckinTab ? tab : undefined;

  const { data: regData, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY(id, page, tab, search),
    queryFn: () =>
      getRegistrationsByActivity(id, {
        page,
        limit: 15,
        status: statusParam,
        checkinStatus: checkinStatusParam,
        search: search || undefined,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["participant-stats", id],
    queryFn: () => getActivityStats(id),
  });

  const registrations: RegistrationDetailExtended[] =
    (regData as any)?.data?.data ?? [];
  const meta = (regData as any)?.data?.meta;
  const stats = (statsData as any)?.data;

  // ── Mutations ───────────────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["participants", id] });
    queryClient.invalidateQueries({ queryKey: ["participant-stats", id] });
  };

  const updateMut = useMutation({
    mutationFn: async ({ regId, status }: { regId: number; status: "approved" | "rejected" | "pending" }) => {
      const res = await updateRegistrationStatus(regId, status);
      if (!(res as any)?.success) throw new Error((res as any)?.error ?? "Cập nhật thất bại");
      return res;
    },
    onSuccess: (_, { status }) => {
      invalidate();
      toast.success(status === "approved" ? "Đã duyệt" : "Đã từ chối");
    },
    onError: (err: any) => toast.error(err?.message ?? "Cập nhật thất bại"),
  });

  const bulkMut = useMutation({
    mutationFn: async ({ ids, status }: { ids: number[]; status: "approved" | "rejected" }) => {
      const res = await bulkUpdateRegistrationStatus(ids, status);
      if (!(res as any)?.success) throw new Error((res as any)?.error ?? "Thao tác thất bại");
      return res;
    },
    onSuccess: (_, { ids, status }) => {
      invalidate();
      setSelected(new Set());
      toast.success(`Đã ${status === "approved" ? "duyệt" : "từ chối"} ${ids.length} đăng ký`);
    },
    onError: (err: any) => toast.error(err?.message ?? "Thao tác hàng loạt thất bại"),
  });

  // ── Selection helpers ───────────────────────────────────────────────────────

  const allIds = registrations.map((r) => r.registrationId);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const toggleOne = (regId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(regId)) next.delete(regId);
      else next.add(regId);
      return next;
    });
  };

  // ── Tab / search helpers ────────────────────────────────────────────────────

  const handleTabChange = useCallback((v: TabValue) => {
    setTab(v);
    setPage(1);
    setSelected(new Set());
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearchInput(v);
    setPage(1);
    setSelected(new Set());
  }, []);

  // ── Excel export ────────────────────────────────────────────────────────────

  function exportExcel() {
    const rows = registrations.map((r, i) => ({
      STT: i + 1,
      "Họ tên": r.user?.userName ?? "",
      Email: r.user?.email ?? "",
      "Mã SV": r.user?.studentId ?? "",
      "Điện thoại": r.user?.phoneNumber ?? "",
      Trường: r.user?.university ?? "",
      Khoa: r.user?.faculty ?? "",
      Lớp: r.user?.className ?? "",
      "Trạng thái": r.status,
      "Thời gian đăng ký": r.registrationTime
        ? new Date(r.registrationTime).toLocaleString("vi-VN")
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSach");
    XLSX.writeFile(wb, `danh-sach-tham-gia-${id}.xlsx`);
  }

  const selectedArr = Array.from(selected);

  return (
    <div className="px-[120px] py-8 bg-gray-50 min-h-screen">
      <h1 className="text-center text-[#08667a] text-xl font-bold mb-6">
        DANH SÁCH THAM GIA
      </h1>

      {/* Search top */}
      <input
        value={searchInput}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Tìm kiếm theo tên, email, mã sinh viên..."
        className="w-full mb-5 px-4 py-2.5 rounded-full bg-white border border-gray-200 outline-none focus:border-[#08667a] text-sm"
      />

      <div className="flex gap-6">
        {/* Main table */}
        <div className="flex-1 min-w-0">
          {/* Tab filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTabChange(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t.value
                    ? "bg-[#08667a] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#08667a]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm">
              <span className="text-teal-700 font-medium">
                Đã chọn {selected.size} mục
              </span>
              <button
                onClick={() => bulkMut.mutate({ ids: selectedArr, status: "approved" })}
                disabled={bulkMut.isPending}
                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
              >
                Duyệt tất cả
              </button>
              <button
                onClick={() => bulkMut.mutate({ ids: selectedArr, status: "rejected" })}
                disabled={bulkMut.isPending}
                className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-50"
              >
                Từ chối tất cả
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-gray-500 text-xs underline ml-auto"
              >
                Bỏ chọn
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[28px_2fr_2fr_1.2fr_90px_130px] gap-2 px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-500 uppercase">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="mt-0.5 cursor-pointer"
              />
              <span>Họ tên</span>
              <span>Email</span>
              <span>Mã SV</span>
              <span>Trạng thái</span>
              <span>Thao tác</span>
            </div>

            {isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="py-16 text-center text-red-500 text-sm">
                Không tải được dữ liệu. Vui lòng thử lại.
              </div>
            ) : registrations.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                Không có dữ liệu
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {registrations.map((r) => (
                  <div
                    key={r.registrationId}
                    className={`grid grid-cols-[28px_2fr_2fr_1.2fr_90px_130px] gap-2 items-center px-4 py-2.5 text-sm hover:bg-gray-50 ${
                      selected.has(r.registrationId) ? "bg-teal-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.registrationId)}
                      onChange={() => toggleOne(r.registrationId)}
                      className="cursor-pointer"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={r.user?.avatarUrl} name={r.user?.userName ?? "?"} />
                      <span className="truncate font-medium">{r.user?.userName ?? "—"}</span>
                    </div>
                    <span className="truncate text-gray-500">{r.user?.email ?? "—"}</span>
                    <span className="text-gray-500">{r.user?.studentId ?? "—"}</span>
                    <StatusBadge status={r.status} />

                    {/* Row actions */}
                    <div className="flex gap-1.5">
                      {(r.status === "pending" || r.status === "waiting") && (
                        <button
                          onClick={() => updateMut.mutate({ regId: r.registrationId, status: "approved" })}
                          disabled={updateMut.isPending}
                          className="bg-green-500 text-white px-2 py-0.5 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                      )}
                      {r.status === "pending" && (
                        <button
                          onClick={() => updateMut.mutate({ regId: r.registrationId, status: "rejected" })}
                          disabled={updateMut.isPending}
                          className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <PaginationCustom
              page={page}
              totalPages={meta?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[190px] shrink-0 flex flex-col gap-3">
          <button
            onClick={exportExcel}
            className="bg-[#08667a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#065a6c]"
          >
            Xuất Excel
          </button>

          <div className="bg-white rounded-xl p-4 shadow-sm space-y-2 text-sm">
            <p className="font-semibold text-gray-700 mb-1">Thống kê</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng</span>
              <span className="font-bold text-[#08667a]">{stats?.total ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chờ duyệt</span>
              <span className="font-medium text-yellow-600">{stats?.pending ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Đã duyệt</span>
              <span className="font-medium text-green-600">{stats?.approved ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Danh sách chờ</span>
              <span className="font-medium text-blue-600">{stats?.waiting ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-in</span>
              <span className="font-medium text-indigo-600">{stats?.checkedIn ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-out</span>
              <span className="font-medium text-purple-600">{stats?.checkedOut ?? 0}</span>
            </div>
            {stats?.maxParticipants && (
              <div className="flex justify-between border-t pt-2 mt-1">
                <span className="text-gray-500">Tối đa</span>
                <span className="font-medium">{stats.maxParticipants}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
