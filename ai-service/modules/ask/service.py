import json
from config.gemini import get_model
from utils.errors import raise_error
from modules.ask.schemas import AskContext

def ask_about_activities(question: str, context: AskContext) -> str:
    model = get_model()
    prompt = f"""You are a helpful assistant for the Student Activity Portal.

Available data:
- Activities: {json.dumps([a.model_dump() for a in context.activities], ensure_ascii=False)}
- Organizations: {json.dumps([o.model_dump() for o in context.organizations], ensure_ascii=False)}

User question: "{question}"

Answer in Vietnamese. Be helpful and concise. If you don't have enough information, say so."""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise_error("AI_PROCESSING_FAILED", str(e))
