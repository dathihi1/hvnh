module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/configs/env.config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "envConfig",
    ()=>envConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
const envVariable = {
    NEXT_PUBLIC_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    NEXT_PUBLIC_API_URL: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    NODE_ENV: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'development',
        'production',
        'test'
    ]).nullable(),
    COOKIE_ACCESS_TOKEN_MAX_AGE: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    COOKIE_REFRESH_TOKEN_MAX_AGE: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
};
const envSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    ...envVariable
});
const result = await envSchema.safeParseAsync({
    NEXT_PUBLIC_URL: ("TURBOPACK compile-time value", "http://localhost:3001"),
    NEXT_PUBLIC_API_URL: ("TURBOPACK compile-time value", "http://localhost:3000"),
    NODE_ENV: ("TURBOPACK compile-time value", "development"),
    COOKIE_ACCESS_TOKEN_MAX_AGE: process.env.COOKIE_ACCESS_TOKEN_MAX_AGE,
    COOKIE_REFRESH_TOKEN_MAX_AGE: process.env.COOKIE_REFRESH_TOKEN_MAX_AGE
});
if (!result.success) {
    throw new Error(result.error.message);
}
const envConfig = result.data;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/src/configs/http.comfig.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "http",
    ()=>http
]);
const isServer = ("TURBOPACK compile-time value", "undefined") === "undefined";
async function fetchData(method, url, body, token, nextOptions) {
    const isFormData = body instanceof FormData;
    const options = {
        method: method,
        credentials: ("TURBOPACK compile-time truthy", 1) ? "omit" : "TURBOPACK unreachable"
    };
    const headers = {};
    if (method !== "GET" && body) {
        options.body = isFormData ? body : JSON.stringify(body);
        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }
    }
    if (isServer && token) {
        headers["Cookie"] = `${token}`;
    }
    options.headers = headers;
    if (nextOptions) {
        options.next = nextOptions;
    }
    const result = await fetch(url, options);
    const data = await result.json();
    return data;
}
const http = {
    get: (url, token, nextOptions)=>fetchData("GET", url, undefined, token, nextOptions),
    post: (url, body, token)=>fetchData("POST", url, body, token),
    put: (url, body, token)=>fetchData("PUT", url, body, token),
    delete: (url, body, token)=>fetchData("DELETE", url, body, token)
};
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/auth/login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$env$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/configs/env.config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$http$2e$comfig$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/configs/http.comfig.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$env$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$env$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function POST(request) {
    const body = await request.json();
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$http$2e$comfig$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["http"].post(`${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$env$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envConfig"].NEXT_PUBLIC_API_URL}/auth/login`, body);
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        code: res.code,
        message: res.message,
        server: res.server
    });
    if ("code" in res) {
        return response;
    }
    response.cookies.set('access_token', res.accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: Number(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$env$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envConfig"].COOKIE_ACCESS_TOKEN_MAX_AGE),
        path: '/'
    });
    response.cookies.set('refresh_token', res.refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: Number(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$configs$2f$env$2e$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["envConfig"].COOKIE_REFRESH_TOKEN_MAX_AGE),
        path: '/'
    });
    return response;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__270e1bf9._.js.map