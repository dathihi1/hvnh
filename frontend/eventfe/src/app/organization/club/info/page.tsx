import Image from "next/image";

export default async function ClubInfoPage(){
  return (
    <div>
      <div className="min-h-screen relative h-[300px] mb-[35px]">
        <Image
          src="/team-building.jpg"
          alt="team-building"
          fill
          priority
          className="w-full h-full object-cover object-center"
        />
      </div>

      <div className="flex justify-around">
        <Image
          src="/team-building.jpg"
          alt="team-building"
          width={1200}
          height={400}
          className="w-[510px] h-[288] rounded-[29px]"
        />

        <div className="flex flex-col items-center gap-[15px]">
          <Image
            src="/logo-club.jpg"
            alt="logo-club"
            width={150}
            height={150}
            className="rounded-full"
          />
          <div className="text-[#1A73E8] text-[28px] font-bold">
            BIT - CLB TIN HỌC NGÂN HÀNG
          </div>
        </div>

        <Image
          src="/team-building.jpg"
          alt="team-building"
          width={1200}
          height={400}
          className="w-[510px] h-[288] rounded-[29px]"
        />
      </div>

      <div className="flex items-center w-full my-10">
        <div className="flex-1 h-[3px] bg-[#08667a]"></div>
        <div>
          <span className="bg-[#08667a] text-white px-8 py-2 rounded-full font-bold text-[16px] uppercase tracking-wider">
            Giới thiệu
          </span>
        </div>
        <div className="flex-1 h-[3px] bg-[#08667a]"></div>
      </div>

      <div className="mx-[20px] rounded-[20px] border-[3px] border-[#1A73E8] p-[20px] h-[600px]">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit...
      </div>

      <div className="flex justify-center gap-6 mt-10 flex-wrap mb-10">
        <button className="bg-[#08667a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#06505f] transition">
          Mở đơn đăng ký
        </button>

        <button className="bg-[#08667a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#06505f] transition">
          Đóng đơn đăng ký
        </button>

        <button className="bg-[#08667a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#06505f] transition">
          Chỉnh sửa thông tin
        </button>

        <button className="bg-[#08667a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#06505f] transition">
          Cập nhật đơn đăng ký
        </button>
      </div>
    </div>
  );
}