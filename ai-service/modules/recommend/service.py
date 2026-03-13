import json, re
from config.gemini import get_model
from utils.errors import raise_error
from modules.recommend.schemas import UserProfile, UpcomingActivity

def get_recommendations(limit: int, user_profile: UserProfile, upcoming: list[UpcomingActivity]) -> list[int]:
    model = get_model()
    prompt = f"""User profile:
- Past activities: {json.dumps([a.model_dump() for a in user_profile.pastActivities], ensure_ascii=False)}
- Club memberships: {json.dumps(user_profile.clubMemberships, ensure_ascii=False)}

Available upcoming activities: {json.dumps([a.model_dump() for a in upcoming], ensure_ascii=False)}

Recommend the top {limit} activities for this user based on their interests and history.
Return as JSON array of IDs: [1, 2, 3]"""
    try:
        response = model.generate_content(prompt)
        text = re.sub(r"```json?\n?|\n?```", "", response.text).strip()
        return json.loads(text)
    except Exception as e:
        raise_error("AI_PROCESSING_FAILED", str(e))
