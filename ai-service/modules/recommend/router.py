from fastapi import APIRouter, Depends
from middlewares.service_auth import verify_service_key
from modules.recommend.schemas import RecommendRequest
from modules.recommend import service

router = APIRouter(dependencies=[Depends(verify_service_key)])

@router.post("")
def recommend(body: RecommendRequest):
    recommended_ids = service.get_recommendations(body.limit, body.userProfile, body.upcomingActivities)
    return {"success": True, "data": {"recommendedIds": recommended_ids}}
