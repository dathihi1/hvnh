/**
 * Convenience type re-exports built on top of the auto-generated OpenAPI types.
 *
 * DO NOT edit api.generated.ts manually — it is overwritten every time you run:
 *   npm run gen:api
 *
 * Workflow:
 *   1. Update the backend route and Swagger JSDoc comments
 *   2. Start the backend: npm run dev  (in /backend)
 *   3. Run in this directory: npm run gen:api
 *   4. Import types from this file in your components/services
 */

import type { paths, components } from "./api.generated";

// ─── Re-export raw generated types (for advanced usage) ───────────────────────
export type { paths, components };

// ─── Shared response wrapper ──────────────────────────────────────────────────
export type ApiSuccess = components["schemas"]["ApiSuccess"];
export type ApiError = components["schemas"]["ApiError"];

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserProfile = components["schemas"]["UserProfile"];
export type AuthTokens = components["schemas"]["AuthTokens"];
export type AuthResponse = components["schemas"]["AuthResponse"];

export type LoginBody =
  paths["/api/auth/login"]["post"]["requestBody"]["content"]["application/json"];

export type RegisterBody =
  paths["/api/auth/register"]["post"]["requestBody"]["content"]["application/json"];

export type ForgotPasswordBody =
  paths["/api/auth/forgot-password"]["post"]["requestBody"]["content"]["application/json"];

export type ResetPasswordBody =
  paths["/api/auth/reset-password"]["post"]["requestBody"]["content"]["application/json"];

export type ChangePasswordBody =
  paths["/api/auth/change-password"]["put"]["requestBody"]["content"]["application/json"];

export type RefreshTokenBody =
  paths["/api/auth/refresh-token"]["post"]["requestBody"]["content"]["application/json"];

// ─── Notifications ────────────────────────────────────────────────────────────
export type Notification = components["schemas"]["Notification"];
export type NotificationStats = components["schemas"]["NotificationStats"];

export type SendNotificationBody =
  paths["/api/thong-bao/send"]["post"]["requestBody"]["content"]["application/json"];

export type SendBulkNotificationBody =
  paths["/api/thong-bao/send-bulk"]["post"]["requestBody"]["content"]["application/json"];

// ─── Admin ────────────────────────────────────────────────────────────────────
export type OverviewStats = components["schemas"]["OverviewStats"];
export type ActivityStats = components["schemas"]["ActivityStats"];

// ─── AI ───────────────────────────────────────────────────────────────────────
export type AiSearchBody =
  paths["/api/ai/search"]["post"]["requestBody"]["content"]["application/json"];

export type AiRecommendBody =
  NonNullable<paths["/api/ai/recommend"]["post"]["requestBody"]>["content"]["application/json"];

export type AiAskBody =
  paths["/api/ai/ask"]["post"]["requestBody"]["content"]["application/json"];

// ─── Response helpers (extract data field from endpoint responses) ─────────────
export type LoginResponse =
  paths["/api/auth/login"]["post"]["responses"][200]["content"]["application/json"];

export type MeResponse =
  paths["/api/auth/me"]["get"]["responses"][200]["content"]["application/json"];

export type NotificationListResponse =
  paths["/api/thong-bao"]["get"]["responses"][200]["content"]["application/json"];

export type NotificationStatsResponse =
  paths["/api/thong-bao/stats"]["get"]["responses"][200]["content"]["application/json"];

export type OverviewStatsResponse =
  paths["/api/admin/stats/overview"]["get"]["responses"][200]["content"]["application/json"];

export type ActivityStatsResponse =
  paths["/api/admin/stats/activities"]["get"]["responses"][200]["content"]["application/json"];
