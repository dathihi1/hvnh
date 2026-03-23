import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#05566B] py-8 w-full">
      <div className="max-w-7xl mx-auto px-8 flex flex-wrap gap-8 items-start justify-between">
        <div className="flex flex-col items-center min-w-[160px]">
          <Image width={80} height={80} alt="Logo" src="/logoheader.png" className="mb-2" />
          <div className="text-white text-[15px] text-center">HỌC VIỆN NGÂN HÀNG</div>
        </div>

        <div className="flex flex-col gap-[12px]">
          <Link href='https://www.hvnh.edu.vn/' className="text-white hover:underline text-sm ">
            Website trường
          </Link>
          <Link href='https://online.hvnh.edu.vn/News/Type/1015' className="text-white hover:underline text-sm">
            Cổng thông tin đào tạo
          </Link>
          <Link href='https://www.hvnh.edu.vn/tuyensinh/vi/home.html' className="text-white hover:underline text-sm">
            Trang tuyển sinh
          </Link>
        </div>

        <div className="flex flex-col gap-[12px] text-white text-sm">
          <p>Địa chỉ: Số 12, đường Chùa Bộc, Quận Đống Đa, Hà Nội</p>
          <p>Website: www.hvnh.edu.vn</p>
          <p>Email: vanphong@hvnh.edu.vn</p>
          <p>Điện thoại: +84 243 852 1305 - Fax: +84 243 852 5024</p>
        </div>
        <div className="grid grid-cols-3 gap-[16px]">
          <Link href="#" >
            <Image src="/icons/wiki.png" alt="Wikipedia" width={40} height={40} />
          </Link>
          <Link href="#" >
            <Image src="/icons/youtube.png" alt="YouTube" width={40} height={40} />
          </Link>
          <Link href="#" >
            <Image src="/icons/facebook.png" alt="Facebook" width={40} height={40} />
          </Link>
          <Link href="#" >
            <Image src="/icons/zalo.png" alt="Zalo" width={40} height={40} />
          </Link>
          <Link href="#" >
            <Image src="/icons/instagram.png" alt="Instagram" width={40} height={40} />
          </Link>
          <Link href="#">
            <Image src="/icons/linkedin.png" alt="LinkedIn" width={40} height={40} />
          </Link>
        </div>
      </div>
    </footer>
  )
}