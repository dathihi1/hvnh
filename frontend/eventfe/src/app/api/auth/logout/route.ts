import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (accessToken) {
    await http.post(
      `${envConfig.NEXT_PUBLIC_API_URL}/auth/logout`,
      {},
      `access_token=${accessToken}`
    );
  }

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ success: true });

  response.cookies.delete("access_token");
  response.cookies.delete("user_role");

  // Clear httpOnly refresh_token cookie (must specify same path)
  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isProd,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
