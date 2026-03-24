"use client";

import Image from "next/image";
import { Search, Users, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getMyOrganization,
  getOrganizationMembers,
  removeMember,
  addMember,
  lookupUserByEmail,
  getAllMembersWithGroups,
  createGroup,
  pushToGroup,
  deleteGroup,
  type LookupUser,
} from "@/services/organization.service";

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

const ROLE_OPTIONS = [
  { value: "member", label: "Thành viên" },
  { value: "vice_head", label: "Phó ban" },
  { value: "head_of_department", label: "Trưởng ban" },
  { value: "vice_president", label: "Phó chủ nhiệm" },
  { value: "president", label: "Chủ nhiệm" },
];

function getRoleLabel(role: string, orgType: string | null | undefined): string {
  const map = orgType === "club" ? ROLE_LABELS_CLUB : ROLE_LABELS_ORG;
  return map[role] ?? role;
}

export default function ClubMemberPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"list" | "groups">("list");
  
  // -- List Tab State --
  const [searchInput, setSearchInput] = useState(""); 
  const [search, setSearch] = useState(""); 
  const [page, setPage] = useState(1);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // -- Add Member State --
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const debouncedEmail = useDebounce(addEmail, 500);
  const [addRole, setAddRole] = useState("member");
  const [previewUser, setPreviewUser] = useState<LookupUser | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // -- Groups Tab State --
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUnassigned, setSelectedUnassigned] = useState<Set<number>>(new Set());
  const [assignTargetGroup, setAssignTargetGroup] = useState<number | "new">("new");
  const [assignNewGroupName, setAssignNewGroupName] = useState("");

  const { data: orgData } = useQuery({ queryKey: ["my-organization"], queryFn: getMyOrganization });
  const orgId = orgData?.data?.organizationId;
  const orgType = orgData?.data?.organizationType ?? null;

  // -- Queries --
  const { data, isLoading, isError } = useQuery({
    queryKey: ["org-members", orgId, page, search],
    queryFn: () => getOrganizationMembers(orgId!, { page, limit: 10, search: search || undefined }),
    enabled: !!orgId && activeTab === "list",
  });
  const members = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["org-groups", orgId],
    queryFn: () => getAllMembersWithGroups(orgId!),
    enabled: !!orgId && activeTab === "groups",
  });
  const grouped = groupsData?.data?.grouped ?? [];
  const ungrouped = groupsData?.data?.ungrouped ?? [];

  // -- Mutations (List) --
  const removeMut = useMutation({
    mutationFn: (userId: number) => removeMember(orgId!, userId),
    onSuccess: () => {
      toast.success("Đã xóa thành viên");
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-groups", orgId] });
      setOpenConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Xóa thất bại");
      setOpenConfirm(false);
    },
  });

  const addMut = useMutation({
    mutationFn: () => addMember(orgId!, previewUser!.userId, addRole),
    onSuccess: () => {
      toast.success("Đã thêm thành viên");
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["org-groups", orgId] });
      setAddOpen(false);
      setAddEmail("");
      setPreviewUser(null);
      setAddRole("member");
      setPreviewError(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Thêm thất bại");
    },
  });

  const lookupMut = useMutation({
    mutationFn: (email: string) => lookupUserByEmail(email),
    onSuccess: (res) => {
      const foundUser = res?.data;
      if (foundUser) {
        setPreviewUser(foundUser);
        setPreviewError(null);
      } else {
        setPreviewUser(null);
        setPreviewError("Không tìm thấy người dùng");
      }
    },
    onError: () => { setPreviewUser(null); setPreviewError("Không tìm thấy người dùng"); },
  });

  useEffect(() => {
    if (debouncedEmail && debouncedEmail.includes("@")) lookupMut.mutate(debouncedEmail);
    else { setPreviewUser(null); setPreviewError(null); }
  }, [debouncedEmail]);

  // -- Mutations (Groups) --
  const createGroupMut = useMutation({
    mutationFn: (name: string) => createGroup(orgId!, { groupName: name }),
    onSuccess: () => {
      toast.success("Tạo nhóm thành công");
      queryClient.invalidateQueries({ queryKey: ["org-groups", orgId] });
      setShowCreateGroup(false);
      setNewGroupName("");
    },
    onError: () => toast.error("Tạo nhóm thất bại"),
  });

  const deleteGroupMut = useMutation({
    mutationFn: (groupId: number) => deleteGroup(orgId!, groupId),
    onSuccess: () => {
      toast.success("Đã xóa nhóm (thành viên được chuyển ra ngoài)");
      queryClient.invalidateQueries({ queryKey: ["org-groups", orgId] });
    },
    onError: () => toast.error("Xóa nhóm thất bại"),
  });

  const assignGroupMut = useMutation({
    mutationFn: () => {
      const payload: any = { memberIds: Array.from(selectedUnassigned) };
      if (assignTargetGroup === "new") payload.newGroupName = assignNewGroupName;
      else payload.groupId = assignTargetGroup;
      return pushToGroup(orgId!, payload);
    },
    onSuccess: () => {
      toast.success("Đã chuyển thành viên vào nhóm");
      queryClient.invalidateQueries({ queryKey: ["org-groups", orgId] });
      setShowAssignModal(false);
      setSelectedUnassigned(new Set());
      setAssignTargetGroup("new");
      setAssignNewGroupName("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Chuyển nhóm thất bại"),
  });

  // -- Render Helpers --
  const toggleUnassigned = (id: number) => {
    const next = new Set(selectedUnassigned);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedUnassigned(next);
  };
  const toggleAllUnassigned = () => {
    if (selectedUnassigned.size === ungrouped.length) setSelectedUnassigned(new Set());
    else setSelectedUnassigned(new Set(ungrouped.map(m => m.userId)));
  };

  return (
    <div className="px-10 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#1A73E8] font-bold text-xl">QUẢN LÝ THÀNH VIÊN</h1>
        <button onClick={() => { setAddEmail(""); setAddRole("member"); setPreviewUser(null); setPreviewError(null); setAddOpen(true); }}
          className="px-5 py-2 rounded-full bg-[#1A73E8] text-white font-medium hover:bg-[#1557b0] text-sm">
          + Thêm thành viên
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab("list")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "list" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          Danh sách thành viên
        </button>
        <button onClick={() => setActiveTab("groups")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === "groups" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
          Hoạt động nhóm (Groups)
        </button>
      </div>

      {/* ======================= LIST TAB ======================= */}
      {activeTab === "list" && (
        <>
          <div className="flex justify-end mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
                placeholder="Tìm theo tên, email, MSSV..."
                className="pl-9 pr-4 py-2 rounded-full bg-gray-100 outline-none w-[280px] text-sm" />
            </div>
          </div>
          <div className="bg-[#e6eaf3] p-4 rounded-xl space-y-3 min-h-[200px]">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1fr_0.8fr] items-center bg-white px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 uppercase tracking-wide gap-2">
              <div>Họ tên</div><div>Email</div><div>SĐT</div><div>MSV</div><div>Trường</div><div>Lớp</div><div>Khoa</div><div className="text-center">Chức vụ</div><div></div>
            </div>
            {isLoading && <div className="text-center text-gray-500 py-8">Đang tải...</div>}
            {!isLoading && members.length === 0 && <div className="text-center text-gray-500 py-8">Không có thành viên nào</div>}
            {members.map((m) => (
              <div key={m.userId} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1fr_0.8fr] items-center bg-white px-4 py-3 rounded-lg text-sm min-w-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {m.user?.avatarUrl ? <Image src={m.user.avatarUrl} alt="avatar" width={35} height={35} className="rounded-full shrink-0 object-cover" /> :
                    <div className="w-[35px] h-[35px] rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xs font-bold">{m.user?.userName?.charAt(0).toUpperCase() ?? "?"}</div>}
                  <span className="truncate">{m.user?.userName ?? "—"}</span>
                </div>
                <div className="truncate text-gray-600">{m.user?.email ?? "—"}</div>
                <div className="text-gray-600">{m.user?.phoneNumber ?? "—"}</div>
                <div className="text-gray-600">{m.user?.studentId ?? "—"}</div>
                <div className="text-gray-600 truncate">{m.user?.university ?? "—"}</div>
                <div className="text-gray-600 truncate">{m.user?.className ?? "—"}</div>
                <div className="text-gray-600 truncate">{m.user?.faculty ?? "—"}</div>
                <div className="text-gray-700 font-medium">{getRoleLabel(m.role ?? "member", orgType)}</div>
                <div className="flex justify-center">
                  <button onClick={() => { setSelectedUserId(m.userId); setOpenConfirm(true); }} className="w-[80px] bg-red-500 text-white py-1 rounded-full text-xs hover:bg-red-600">Xóa</button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 text-sm">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="disabled:text-gray-300">{"< Trước"}</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-3 rounded ${page === i + 1 ? "bg-[#08667a] text-white" : ""}`}>{i + 1}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="disabled:text-gray-300">{"Tiếp theo >"}</button>
            </div>
          )}
          <div className="flex justify-end mt-4 text-[#1A73E8] font-bold uppercase">TỔNG SỐ THÀNH VIÊN: {total}</div>
        </>
      )}

      {/* ======================= GROUPS TAB ======================= */}
      {activeTab === "groups" && (
        <div className="flex gap-6 items-start">
          {/* Left Col: Groups */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-700">Các nhóm ({grouped.length})</h2>
              <button onClick={() => setShowCreateGroup(true)} className="text-sm font-medium text-teal-600 hover:underline">+ Tạo nhóm mới</button>
            </div>
            {groupsLoading ? <div className="text-gray-400">Đang tải...</div> : grouped.length === 0 ? <div className="text-gray-500 text-sm">Chưa có nhóm nào.</div> : (
              <div className="space-y-3">
                {grouped.map(g => {
                  const isExpanded = expandedGroup === g.groupId;
                  return (
                    <div key={g.groupId} className="bg-white border rounded-lg overflow-hidden shrink-0 shadow-sm transition">
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedGroup(isExpanded ? null : g.groupId)}>
                        <div className="flex items-center gap-3">
                          <Users className="text-teal-600 w-5 h-5" />
                          <span className="font-semibold text-sm text-gray-800">{g.groupName}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{g.members?.length ?? 0}</span>
                        </div>
                        <Trash2 className="text-red-400 w-4 h-4 hover:text-red-600" onClick={(e) => { e.stopPropagation(); if (confirm("Xóa nhóm này? Các thành viên sẽ thành Chưa có nhóm.")) deleteGroupMut.mutate(g.groupId); }} />
                      </div>
                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-3 flex flex-col gap-2">
                          {(g.members ?? []).length === 0 ? <p className="text-xs text-gray-400">Nhóm trống, chưa có thành viên.</p> :
                            g.members!.map(m => (
                              <div key={m.userId} className="flex items-center gap-2 text-xs">
                                {m.user?.avatarUrl ? <Image src={m.user.avatarUrl} alt="avt" width={24} height={24} className="rounded-full" /> : <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 truncate">{m.user?.userName?.charAt(0)}</div>}
                                <span className="font-medium text-gray-700">{m.user?.userName}</span>
                                <span className="text-gray-400">({getRoleLabel(m.role ?? "member", orgType)})</span>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Col: Ungrouped */}
          <div className="w-[400px] bg-white border rounded-xl p-4 shadow-sm self-start">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h2 className="text-sm font-bold text-gray-700">Chưa có nhóm ({ungrouped.length})</h2>
              {selectedUnassigned.size > 0 && (
                <button onClick={() => setShowAssignModal(true)} className="bg-teal-600 text-white text-xs px-2.5 py-1 rounded hover:bg-teal-700 transition">
                  Ghép nhóm ({selectedUnassigned.size})
                </button>
              )}
            </div>
            {groupsLoading ? <div className="text-gray-400 text-xs">Đang tải...</div> : ungrouped.length === 0 ? <div className="text-gray-500 text-xs">Tất cả thành viên đã được phân nhóm.</div> : (
              <div className="max-h-[500px] overflow-y-auto space-y-1">
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-500 mb-1 border-b">
                  <input type="checkbox" checked={selectedUnassigned.size > 0 && selectedUnassigned.size === ungrouped.length} onChange={toggleAllUnassigned} className="cursor-pointer" />
                  <span>Chọn tất cả</span>
                </div>
                {ungrouped.map(m => (
                  <label key={m.userId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition">
                    <input type="checkbox" checked={selectedUnassigned.has(m.userId)} onChange={() => toggleUnassigned(m.userId)} />
                    {m.user?.avatarUrl ? <Image src={m.user?.avatarUrl} alt="avt" width={24} height={24} className="rounded-full" /> : <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0 flex items-center justify-center font-bold text-gray-500 text-xs">{m.user?.userName?.charAt(0)}</div>}
                    <span className="text-sm font-medium text-gray-700 truncate">{m.user?.userName}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Modals --- */}
      {openConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">Xóa thành viên này khỏi tổ chức?</h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => setOpenConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-300">Hủy</button>
              <button disabled={removeMut.isPending} onClick={() => { if (selectedUserId !== null) removeMut.mutate(selectedUserId); }} className="px-4 py-2 rounded-lg bg-red-500 text-white">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">Thêm thành viên</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email người dùng</label>
              <input type="email" value={addEmail} onChange={(e) => { setAddEmail(e.target.value); setPreviewUser(null); setPreviewError(null); }} placeholder="VD: student@edu.vn" className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
            </div>
            {lookupMut.isPending && <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center text-sm text-gray-500">Đang tìm...</div>}
            {previewError && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-600">{previewError}</div>}
            {previewUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  {previewUser.avatarUrl ? <Image src={previewUser.avatarUrl} alt="avt" width={48} height={48} className="rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg">{previewUser.userName.charAt(0).toUpperCase()}</div>}
                  <div><div className="font-semibold text-sm">{previewUser.userName}</div><div className="text-xs text-gray-500">{previewUser.email}</div></div>
                </div>
              </div>
            )}
            {previewUser && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                <select value={addRole} onChange={(e) => setAddRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-lg bg-gray-300">Hủy</button>
              <button disabled={!previewUser || addMut.isPending} onClick={() => { if (previewUser) addMut.mutate(); }} className="px-4 py-2 rounded-lg bg-[#1A73E8] text-white">Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl p-6 w-[400px]">
            <h2 className="font-bold mb-4 text-[#0E5C63]">Tạo nhóm mới</h2>
            <input type="text" placeholder="Tên nhóm (VD: Ban truyền thông)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateGroup(false)} className="px-4 py-2 rounded text-sm bg-gray-100 font-medium">Hủy</button>
              <button disabled={!newGroupName.trim() || createGroupMut.isPending} onClick={() => createGroupMut.mutate(newGroupName)} className="px-4 py-2 rounded text-sm bg-teal-600 text-white font-medium disabled:opacity-50">Tạo</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl p-6 w-[450px]">
            <h2 className="font-bold mb-4 text-[#0E5C63]">Ghép chức danh/nhóm ({selectedUnassigned.size} người)</h2>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" checked={assignTargetGroup === "new"} onChange={() => setAssignTargetGroup("new")} />
                Tạo nhóm mới
              </label>
              {assignTargetGroup === "new" && (
                <input type="text" placeholder="Nhập tên nhóm mới..." value={assignNewGroupName} onChange={(e) => setAssignNewGroupName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm ml-6" />
              )}
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="radio" checked={assignTargetGroup !== "new"} onChange={() => { if (grouped.length > 0) setAssignTargetGroup(grouped[0].groupId); }} disabled={grouped.length === 0} />
                Thêm vào nhóm có sẵn
              </label>
              {assignTargetGroup !== "new" && (
                <select value={assignTargetGroup} onChange={(e) => setAssignTargetGroup(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm ml-6">
                  {grouped.map(g => <option key={g.groupId} value={g.groupId}>{g.groupName}</option>)}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded text-sm bg-gray-100 font-medium">Hủy</button>
              <button disabled={assignGroupMut.isPending || (assignTargetGroup === "new" && !assignNewGroupName.trim())} onClick={() => assignGroupMut.mutate()} className="px-4 py-2 rounded text-sm bg-teal-600 text-white font-medium disabled:opacity-50">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
