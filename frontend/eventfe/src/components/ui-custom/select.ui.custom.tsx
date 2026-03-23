"use client"
import { useState } from "react"
import { ChevronDownIcon, CheckIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectCustomProps {
  value?: string
  onChange?: (value: string | null) => void
  data: { id: string; name: string }[]
  placeholder?: string
  className?: string
}

export function SelectCustom({
  value,
  onChange,
  data,
  placeholder = "Chọn trường...",
  className,
}: SelectCustomProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedName = data.find((item) => item.id === value)?.name ?? ""
  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  function select(id: string) {
    onChange?.(id)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev)
          setSearch("")
        }}
        className={cn(
          "flex h-[46px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="flex-1 truncate text-left">
          {selectedName || placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 opacity-50 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-1 rounded-md border border-input bg-popover text-popover-foreground shadow-md">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="h-8 w-full rounded-sm border border-input bg-transparent pl-7 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          </div>
          <div className="max-h-[180px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="py-3 text-center text-sm text-muted-foreground">
                Không tìm thấy kết quả
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className={cn(
                    "flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === item.id && "bg-accent/40"
                  )}
                >
                  <span className="flex-1 text-left">{item.name}</span>
                  {value === item.id && (
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
