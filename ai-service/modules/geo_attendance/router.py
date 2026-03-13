from fastapi import APIRouter, Depends
from middlewares.service_auth import verify_service_key
from modules.geo_attendance.schemas import GeoAttendanceRequest
from modules.geo_attendance import service

router = APIRouter(dependencies=[Depends(verify_service_key)])

@router.post("")
def geo_attendance(body: GeoAttendanceRequest):
    result = service.check_attendance(body)
    return {"success": True, "data": result.model_dump()}
