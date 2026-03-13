from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from modules.search.router import router as search_router
from modules.recommend.router import router as recommend_router
from modules.ask.router import router as ask_router
from modules.scan_id.router import router as scan_id_router
from modules.geo_attendance.router import router as geo_attendance_router
from modules.chatbot.router import router as chatbot_router

def create_app() -> FastAPI:
    app = FastAPI(title="AI Service", docs_url="/docs")

    @app.get("/health")
    def health():
        return {"success": True, "message": "AI Service OK"}

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"success": False, "code": "INTERNAL_ERROR", "message": str(exc)},
        )

    app.include_router(search_router,         prefix="/api/search")
    app.include_router(recommend_router,      prefix="/api/recommend")
    app.include_router(ask_router,            prefix="/api/ask")
    app.include_router(scan_id_router,        prefix="/api/scan-id")
    app.include_router(geo_attendance_router, prefix="/api/geo-attendance")
    app.include_router(chatbot_router,        prefix="/api/chatbot")

    return app
