from fastapi import APIRouter, Depends
from middlewares.service_auth import verify_service_key
from modules.chatbot.schemas import ChatRequest, ChatResponse
from modules.chatbot import service

router = APIRouter(dependencies=[Depends(verify_service_key)])


@router.post("", response_model=dict)
def chat(body: ChatRequest):
    reply, updated_history = service.chat(body.message, body.history, body.context)
    return {
        "success": True,
        "data": {
            "reply": reply,
            "history": [msg.model_dump() for msg in updated_history],
        },
    }
