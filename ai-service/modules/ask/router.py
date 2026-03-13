from fastapi import APIRouter, Depends
from middlewares.service_auth import verify_service_key
from modules.ask.schemas import AskRequest
from modules.ask import service

router = APIRouter(dependencies=[Depends(verify_service_key)])

@router.post("")
def ask(body: AskRequest):
    answer = service.ask_about_activities(body.question, body.context)
    return {"success": True, "data": {"answer": answer}}
