/**
 * API Test Script
 * Run: node environment/database/test-api.js
 */

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const req = async (method, path, body, token) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const assert = (label, condition, detail = "") => {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
};

// ─── Tests ────────────────────────────────────────────────────────────────────

const runTests = async () => {
  console.log("=".repeat(55));
  console.log(" API TEST SUITE");
  console.log("=".repeat(55));

  // ── Health ────────────────────────────────────────────────
  console.log("\n[Health]");
  const health = await req("GET", "/health");
  assert("GET /health returns 200", health.status === 200);
  assert("GET /health success=true", health.data.success === true);

  // ── Register ──────────────────────────────────────────────
  console.log("\n[Auth] Register");
  const ts = Date.now();
  const regRes = await req("POST", "/api/auth/register", {
    userName: "Test User",
    email: `test_${ts}@example.com`,
    password: "Test@1234",
    university: "Test University",
  });
  assert("POST /api/auth/register returns 201", regRes.status === 201, JSON.stringify(regRes.data));
  assert("Register returns accessToken", !!regRes.data?.data?.accessToken);
  assert("Register returns user.userId", !!regRes.data?.data?.user?.userId);

  // ── Login — invalid creds ─────────────────────────────────
  console.log("\n[Auth] Login — invalid credentials");
  const badLogin = await req("POST", "/api/auth/login", {
    email: "nobody@nowhere.com",
    password: "wrong",
  });
  assert("Login with bad creds returns 4xx", badLogin.status >= 400, `got ${badLogin.status}`);

  // ── Login — student ───────────────────────────────────────
  console.log("\n[Auth] Login — student@test.com");
  const studentLogin = await req("POST", "/api/auth/login", {
    email: "student@test.com",
    password: "Student@123",
  });
  assert("Login student returns 200", studentLogin.status === 200, JSON.stringify(studentLogin.data));
  const studentToken = studentLogin.data?.data?.accessToken;
  assert("Login student returns accessToken", !!studentToken);
  const studentRefresh = studentLogin.data?.data?.refreshToken;

  // ── Login — admin ─────────────────────────────────────────
  console.log("\n[Auth] Login — admin@test.com");
  const adminLogin = await req("POST", "/api/auth/login", {
    email: "admin@test.com",
    password: "Admin@123",
  });
  assert("Login admin returns 200", adminLogin.status === 200, JSON.stringify(adminLogin.data));
  const adminToken = adminLogin.data?.data?.accessToken;
  assert("Login admin returns accessToken", !!adminToken);

  // ── Login — organization_leader ───────────────────────────
  console.log("\n[Auth] Login — leader@test.com");
  const leaderLogin = await req("POST", "/api/auth/login", {
    email: "leader@test.com",
    password: "Leader@123",
  });
  assert("Login leader returns 200", leaderLogin.status === 200, JSON.stringify(leaderLogin.data));
  const leaderToken = leaderLogin.data?.data?.accessToken;

  // ── GET /me ───────────────────────────────────────────────
  console.log("\n[Auth] GET /me");
  const meRes = await req("GET", "/api/auth/me", null, studentToken);
  assert("GET /api/auth/me returns 200", meRes.status === 200, JSON.stringify(meRes.data));
  assert("GET /me returns userId", !!meRes.data?.data?.user?.userId);
  assert("GET /me returns roles array", Array.isArray(meRes.data?.data?.user?.roles));

  const meNoToken = await req("GET", "/api/auth/me");
  assert("GET /me without token returns 401", meNoToken.status === 401, `got ${meNoToken.status}`);

  // ── Refresh token ─────────────────────────────────────────
  console.log("\n[Auth] Refresh token");
  const refreshRes = await req("POST", "/api/auth/refresh-token", {
    refreshToken: studentRefresh,
  });
  assert("POST /refresh-token returns 200", refreshRes.status === 200, JSON.stringify(refreshRes.data));
  assert("Refresh returns new accessToken", !!refreshRes.data?.data?.accessToken);

  // ── Change password ───────────────────────────────────────
  console.log("\n[Auth] Change password");
  const changePwRes = await req(
    "PUT",
    "/api/auth/change-password",
    { oldPassword: "wrong_old", newPassword: "NewPass@123" },
    studentToken
  );
  assert("Change password with wrong old → 4xx", changePwRes.status >= 400, `got ${changePwRes.status}`);

  // ── Notifications — student (read own) ───────────────────
  console.log("\n[Notifications] GET / (student)");
  const notifRes = await req("GET", "/api/notifications", null, studentToken);
  assert("GET /api/notifications returns 200", notifRes.status === 200, JSON.stringify(notifRes.data));
  assert("Notifications returns data array", Array.isArray(notifRes.data?.data?.data));
  assert("Notifications returns meta", !!notifRes.data?.data?.meta);

  // ── Notifications — send (admin only) ────────────────────
  console.log("\n[Notifications] POST /send (admin)");
  const studentId = studentLogin.data?.data?.user?.userId;
  const sendRes = await req(
    "POST",
    "/api/notifications/send",
    {
      title: "Test Notification",
      content: "Hello from test suite",
      userId: studentId,
      notificationType: "system",
      channels: ["IN_APP"],
    },
    adminToken
  );
  assert("POST /send as admin returns 2xx", sendRes.status < 300, `got ${sendRes.status} — ${JSON.stringify(sendRes.data)}`);

  // Student cannot send notification
  const sendUnauth = await req(
    "POST",
    "/api/notifications/send",
    { title: "X", content: "Y", userId: studentId, channels: ["IN_APP"] },
    studentToken
  );
  assert("POST /send as student returns 403", sendUnauth.status === 403, `got ${sendUnauth.status}`);

  // ── Notifications stats ───────────────────────────────────
  console.log("\n[Notifications] GET /stats");
  const statsRes = await req("GET", "/api/notifications/stats", null, studentToken);
  assert("GET /stats returns 200", statsRes.status === 200, JSON.stringify(statsRes.data));
  assert("GET /stats returns unreadCount", typeof statsRes.data?.data?.unreadCount === "number");

  // ── Logout ────────────────────────────────────────────────
  console.log("\n[Auth] Logout");
  const logoutRes = await req("POST", "/api/auth/logout", null, studentToken);
  assert("POST /logout returns 200", logoutRes.status === 200, JSON.stringify(logoutRes.data));

  // Token should be blacklisted after logout
  const meAfterLogout = await req("GET", "/api/auth/me", null, studentToken);
  assert("GET /me after logout returns 401", meAfterLogout.status === 401, `got ${meAfterLogout.status}`);

  // ── Admin — Stats ─────────────────────────────────────────
  console.log("\n[Admin] Stats");
  const overviewRes = await req("GET", "/api/admin/stats/overview", null, adminToken);
  assert("GET /admin/stats/overview returns 200", overviewRes.status === 200, JSON.stringify(overviewRes.data));
  assert("Overview has totalUsers", typeof overviewRes.data?.data?.totalUsers === "number");

  const activityStatsRes = await req("GET", "/api/admin/stats/activities", null, adminToken);
  assert("GET /admin/stats/activities returns 200", activityStatsRes.status === 200, JSON.stringify(activityStatsRes.data));

  // Re-login student (old token was blacklisted after logout)
  const studentRelogin = await req("POST", "/api/auth/login", { email: "student@test.com", password: "Student@123" });
  const freshStudentToken = studentRelogin.data?.data?.accessToken;

  // Student cannot access admin stats
  const adminForbidden = await req("GET", "/api/admin/stats/overview", null, freshStudentToken);
  assert("GET /admin/stats/overview as student returns 403", adminForbidden.status === 403, `got ${adminForbidden.status}`);

  // ── Admin — Create single user ────────────────────────────
  console.log("\n[Admin] Create user");
  const ts2 = Date.now();
  const createUserRes = await req(
    "POST",
    "/api/admin/users",
    {
      userName: "New Student",
      email: `new_${ts2}@example.com`,
      password: "Pass@1234",
      university: "Test University",
      role: "student",
    },
    adminToken
  );
  assert("POST /admin/users returns 201", createUserRes.status === 201, JSON.stringify(createUserRes.data));
  assert("Created user has userId", !!createUserRes.data?.data?.userId);
  assert("Created user has role=student", createUserRes.data?.data?.role === "student");

  // ── Admin — Import CSV ────────────────────────────────────
  console.log("\n[Admin] Import users from CSV");
  const ts3 = Date.now();
  const csvBody = [
    "userName,email,password,university,studentId,role",
    `CSV User 1,csv1_${ts3}@example.com,Pass@1234,University A,SV${ts3}1,student`,
    `CSV User 2,csv2_${ts3}@example.com,Pass@1234,University B,SV${ts3}2,student`,
    `CSV User 3,csv3_${ts3}@example.com,Pass@1234,University C,,organization_member`,
  ].join("\n");

  const importRes = await req(
    "POST",
    "/api/admin/users/import",
    { csv: csvBody },
    adminToken
  );
  assert("POST /admin/users/import returns 201", importRes.status === 201, JSON.stringify(importRes.data));
  assert("Import created 3 users", importRes.data?.data?.created === 3, `created=${importRes.data?.data?.created}`);
  assert("Import has 0 errors", importRes.data?.data?.failed === 0, `failed=${importRes.data?.data?.failed}`);

  // Duplicate email in CSV should go to errors
  const dupCsvBody = [
    "userName,email,password,university",
    `CSV User 1,csv1_${ts3}@example.com,Pass@1234,University A`,
  ].join("\n");
  const dupImportRes = await req("POST", "/api/admin/users/import", { csv: dupCsvBody }, adminToken);
  assert("Import duplicate email → failed=1", dupImportRes.data?.data?.failed === 1, JSON.stringify(dupImportRes.data?.data));

  // Missing required column in CSV
  const badCsvBody = "userName,email\nFoo,foo@x.com";
  const badImportRes = await req("POST", "/api/admin/users/import", { csv: badCsvBody }, adminToken);
  assert("Import missing columns returns 4xx", badImportRes.status >= 400, `got ${badImportRes.status}`);

  // ── Summary ───────────────────────────────────────────────
  console.log("\n" + "=".repeat(55));
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55));

  if (failed > 0) process.exit(1);
};

runTests().catch((err) => {
  console.error("Test runner error:", err.message);
  process.exit(1);
});
