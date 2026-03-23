import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await http.post(`${envConfig.NEXT_PUBLIC_API_URL}/auth/register`, body) as any;

  if (!res?.success) {
    return NextResponse.json(
      { code: res?.code, message: res?.message },
      { status: 400 }
    );
  }

  const { userId, email } = res.data;

  return NextResponse.json({ success: true, userId, email });
}
