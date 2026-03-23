import { envConfig } from "@/configs/env.config";
import { http } from "@/configs/http.comfig";

const BASE = `${envConfig.NEXT_PUBLIC_API_URL}/auth`;

export interface UserProfile {
  userId: number;
  userName: string;
  email: string;
  university: string;
  faculty: string | null;
  className: string | null;
  studentId: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  status: string;
  roles: string[];
}

// Backend GET /auth/me trả: { success: true, data: { user: UserProfile } }
export interface MeResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
}

export async function getMe(token?: string) {
  return http.get<MeResponse>(`${BASE}/me`, token);
}

export async function logout(refreshToken?: string) {
  return http.post<{ success: boolean }>("/api/auth/logout", { refreshToken });
}
