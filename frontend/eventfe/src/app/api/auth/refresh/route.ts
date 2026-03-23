import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function decodeJwtRole(token: string): string {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
    return payload?.role ?? "student"
  } catch {
    return "student"
  }
}

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { code: "MISSING_TOKEN", message: "Not authenticated" },
      { status: 401 }
    );
  }

  const res = await http.post(
    `${envConfig.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
    { refreshToken }
  ) as any;

  if (!res?.success) {
    // Clear all auth cookies on failed refresh
    const response = NextResponse.json(
      { code: res?.code ?? "REFRESH_FAILED", message: res?.message ?? "Token refresh failed" },
      { status: 401 }
    );
    response.cookies.delete("access_token");
    response.cookies.delete("user_role");
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const isProd = process.env.NODE_ENV === "production";
  const accessMaxAge = Number(envConfig.COOKIE_ACCESS_TOKEN_MAX_AGE) || 1800;
  const refreshMaxAge = Number(envConfig.COOKIE_REFRESH_TOKEN_MAX_AGE) || 2592000;
  const response = NextResponse.json({ success: true });

  response.cookies.set("access_token", res.data.accessToken, {
    httpOnly: false,
    secure: isProd,
    maxAge: accessMaxAge,
    path: "/",
    sameSite: "lax",
  });

  // Re-derive role from new JWT and refresh its cookie lifetime
  const role = decodeJwtRole(res.data.accessToken)
  response.cookies.set("user_role", role, {
    httpOnly: false,
    secure: isProd,
    maxAge: refreshMaxAge,
    path: "/",
    sameSite: "lax",
  });

  // Rotate refresh token cookie with the new token from backend
  if (res.data.refreshToken) {
    response.cookies.set("refresh_token", res.data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      maxAge: refreshMaxAge,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}
