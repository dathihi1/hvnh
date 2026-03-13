import json
from config.gemini import get_model
from utils.errors import raise_error
from modules.chatbot.schemas import ChatMessage, PortalContext

SYSTEM_PROMPT = """Bạn là trợ lý AI của Student Activity Portal - nền tảng quản lý hoạt động sinh viên.

Nhiệm vụ của bạn:
- Giúp sinh viên tìm kiếm và đăng ký hoạt động phù hợp
- Trả lời câu hỏi về các tổ chức, câu lạc bộ trong trường
- Hỗ trợ thông tin về lịch trình, địa điểm, hình thức đăng ký
- Tư vấn hoạt động dựa trên sở thích của sinh viên

Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện và ngắn gọn
- Nếu không có đủ thông tin, nói rõ và gợi ý liên hệ ban tổ chức
- Không bịa đặt thông tin về hoạt động không có trong dữ liệu
"""


def build_system_prompt(context: PortalContext) -> str:
    parts = [SYSTEM_PROMPT]

    if context.activities:
        parts.append(f"\nDanh sách hoạt động hiện có:\n{json.dumps(context.activities, ensure_ascii=False, indent=2)}")

    if context.organizations:
        parts.append(f"\nDanh sách tổ chức:\n{json.dumps(context.organizations, ensure_ascii=False, indent=2)}")

    if context.currentUser:
        parts.append(f"\nThông tin sinh viên đang chat:\n{json.dumps(context.currentUser, ensure_ascii=False)}")

    return "\n".join(parts)


def chat(message: str, history: list[ChatMessage], context: PortalContext) -> tuple[str, list[ChatMessage]]:
    model = get_model("gemini-flash-latest")

    system_prompt = build_system_prompt(context)

    # Convert history to Gemini format
    gemini_history = []
    for msg in history:
        gemini_history.append({
            "role": msg.role,
            "parts": [msg.content],
        })

    try:
        chat_session = model.start_chat(
            history=[
                {"role": "user", "parts": [system_prompt]},
                {"role": "model", "parts": ["Tôi đã hiểu. Tôi sẵn sàng hỗ trợ sinh viên!"]},
                *gemini_history,
            ]
        )

        response = chat_session.send_message(message)
        reply = response.text

        updated_history = [
            *history,
            ChatMessage(role="user", content=message),
            ChatMessage(role="model", content=reply),
        ]

        return reply, updated_history

    except Exception as e:
        raise_error("AI_PROCESSING_FAILED", str(e))
