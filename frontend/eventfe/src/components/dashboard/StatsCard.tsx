import { ReactNode } from "react"

type Props = {
  title: string
  value: number | string
  icon: ReactNode
}

export default function StatsCard({ title, value, icon }: Props) {
  return (
    <div className="bg-white rounded-xl px-6 py-5 flex items-center justify-between shadow-sm">
      
      {/* LEFT */}
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>

      {/* RIGHT ICON */}
      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100">
        {icon}
      </div>
    </div>
  )
}