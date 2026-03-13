from fastapi import APIRouter, Depends
from middlewares.service_auth import verify_service_key
from modules.search.schemas import SearchRequest
from modules.search import service

router = APIRouter(dependencies=[Depends(verify_service_key)])

@router.post("")
def search(body: SearchRequest):
    matched_ids = service.smart_search(body.query, body.limit, body.activities)
    return {"success": True, "data": {"matchedIds": matched_ids}}
