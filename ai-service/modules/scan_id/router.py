from fastapi import APIRouter, Depends
from middlewares.service_auth import verify_service_key
from modules.scan_id.schemas import ScanIdRequest
from modules.scan_id import service

router = APIRouter(dependencies=[Depends(verify_service_key)])

@router.post("")
def scan_id(body: ScanIdRequest):
    extracted = service.scan_student_id(body.image, body.mimeType)
    return {"success": True, "data": {"extracted": extracted}}
