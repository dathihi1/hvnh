import Image from "next/image"

type Props = {
  title: string
  time: string
  tag?: string
}

export default function EventCard({ title, time, tag }: Props) {
  return (
    <div className="relative flex flex-col items-center text-center w-[180px]">
      
      {/* TAG */}
      {tag && (
        <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 bg-orange-400 text-white text-xs px-3 py-1 rounded-full">
          {tag}
        </div>
      )}

      {/* LOGO */}
      <Image
        src="/logoheader.png"
        alt="event"
        width={80}
        height={80}
        className="mb-3"
      />

      {/* TITLE */}
      <p className="text-sm font-semibold text-blue-700 leading-snug">
        {title}
      </p>

      {/* TIME */}
      <p className="text-xs text-gray-500 mt-1">
        {time}
      </p>
    </div>
  )
}