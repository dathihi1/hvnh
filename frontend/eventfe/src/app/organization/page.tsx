import StatsCard from "@/components/dashboard/StatsCard"
import EventCard from "@/components/dashboard/EventCard"
import { Activity, Users, GraduationCap } from "lucide-react"

export default function OrganizationDashboard() {
  return (
    <div className="px-[180px] py-10 bg-gray-100 min-h-screen">
      
      <h1 className="text-center text-[#0E5C63] font-bold text-xl mb-10">
        THỐNG KÊ
      </h1>

      <div className="grid grid-cols-3 gap-10 mb-10">
        <StatsCard
          title="Sự kiện đang chạy"
          value={12}
          icon={<Activity className="w-5 h-5 text-green-500" />}
        />
        <StatsCard
          title="Tổng lượt đăng ký"
          value={689}
          icon={<Users className="w-5 h-5 text-purple-500" />}
        />
        <StatsCard
          title="Thành viên mới"
          value={12}
          icon={<GraduationCap className="w-5 h-5 text-yellow-500" />}
        />
      </div>

      <div className="bg-white rounded-xl p-6">
        
        <p className="text-center text-gray-600 mb-6 font-medium">
          Lịch nhắc việc
        </p>

        <div className="flex justify-between items-start">
          <EventCard
            title="Chung kết chia khóa thành công năm 2025"
            time="07/02/2005"
            tag="Học thuật"
          />
          <EventCard
            title="Tọa đàm: Tư giác mở rộng hiểu biết..."
            time="Thời gian"
            tag="Phi học thuật"
          />
          <EventCard
            title="Tên sự kiện"
            time="Thời gian"
            tag="Phi học thuật"
          />
          <EventCard
            title="Tên sự kiện"
            time="Thời gian"
            tag="Học thuật"
          />
        </div>

        <div className="flex justify-end mt-6">
          <button className="bg-[#0E5C63] text-white px-4 py-2 rounded-md text-sm">
            Xem tất
          </button>
        </div>
      </div>
    </div>
  )
}