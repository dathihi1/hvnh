import json, re
from config.gemini import get_model
from utils.errors import raise_error
from modules.search.schemas import ActivityItem

def smart_search(query: str, limit: int, activities: list[ActivityItem]) -> list[int]:
    model = get_model()
    activities_json = json.dumps([a.model_dump() for a in activities], ensure_ascii=False)
    prompt = f"""Given these activities: {activities_json}

User search query: "{query}"

Return the top {limit} most relevant activity IDs as a JSON array, ordered by relevance.
Only return the JSON array, no other text. Format: [1, 2, 3]"""
    try:
        response = model.generate_content(prompt)
        text = re.sub(r"```json?\n?|\n?```", "", response.text).strip()
        return json.loads(text)
    except Exception as e:
        raise_error("AI_PROCESSING_FAILED", str(e))
