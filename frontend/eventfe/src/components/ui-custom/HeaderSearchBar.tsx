"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "@/services/activity.service"

export function HeaderSearchBar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [openOnly, setOpenOnly] = useState(false)
  const [useTime, setUseTime] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [useCategory, setUseCategory] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: categoriesData } = useQuery({
    queryKey: ["activity-categories"],
    queryFn: () => getCategories(),
    staleTime: 1000 * 60 * 10,
  })
  const categories = categoriesData?.data ?? []

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  function handleSearch() {
    const params = new URLSearchParams()
    if (query.trim()) params.set("search", query.trim())
    if (openOnly) params.set("status", "published")
    if (useTime && startDate) params.set("startDate", startDate)
    if (useTime && endDate) params.set("endDate", endDate)
    if (useCategory && selectedCategory) params.set("categoryId", selectedCategory)
    router.push(`/event?${params.toString()}`)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative bg-white rounded-[50px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          className="pl-9 pr-4 h-9 w-[200px] rounded-full bg-transparent text-sm outline-none"
        />
      </div>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[220px] rounded-[10px] overflow-hidden shadow-xl z-[1100]"
          style={{ background: "#05566B" }}
        >
          <div className="px-4 pt-4 pb-2 text-white font-bold text-[13px] tracking-wide border-b border-white/20">
            BỘ LỌC
          </div>

          {/* Đang mở đơn */}
          <label className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white/10">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4 accent-white"
            />
            <span className="text-white text-[13px]">Đang mở đơn</span>
          </label>

          {/* Thời gian */}
          <div>
            <label className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white/10">
              <input
                type="checkbox"
                checked={useTime}
                onChange={(e) => setUseTime(e.target.checked)}
                className="w-4 h-4 accent-white"
              />
              <span className="text-white text-[13px]">Thời gian</span>
            </label>
            {useTime && (
              <div className="px-6 pb-3 space-y-2">
                <div>
                  <p className="text-white/70 text-[11px] italic mb-1">Từ:</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md px-2 py-1 text-[12px] bg-white/10 text-white border border-white/30 outline-none"
                  />
                </div>
                <div>
                  <p className="text-white/70 text-[11px] italic mb-1">Đến:</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md px-2 py-1 text-[12px] bg-white/10 text-white border border-white/30 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Phân loại */}
          {categories.length > 0 && (
            <div>
              <label className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={useCategory}
                  onChange={(e) => {
                    setUseCategory(e.target.checked)
                    if (!e.target.checked) setSelectedCategory("")
                  }}
                  className="w-4 h-4 accent-white"
                />
                <span className="text-white text-[13px]">Phân loại</span>
              </label>
              {useCategory && (
                <div className="px-6 pb-3 space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.categoryId} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={String(cat.categoryId)}
                        checked={selectedCategory === String(cat.categoryId)}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-4 h-4 accent-white"
                      />
                      <span className="text-white text-[13px]">{cat.categoryName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="px-4 py-3 border-t border-white/20">
            <button
              onClick={handleSearch}
              className="w-full py-1.5 rounded-full bg-white text-[#05566B] text-[13px] font-semibold hover:bg-white/90 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
