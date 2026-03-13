import json, re
from config.gemini import get_model
from utils.errors import raise_error

def scan_student_id(image_base64: str, mime_type: str) -> dict:
    model = get_model("gemini-flash-latest")
    prompt = """Analyze this student ID card image and extract the following information.
Return ONLY a JSON object with these exact fields:
{
  "studentId": "the student ID number or null",
  "fullName": "the student full name or null",
  "university": "the university name or null",
  "dateOfBirth": "date of birth in YYYY-MM-DD format or null",
  "majorOrClass": "major or class information or null",
  "confidence": "HIGH, MEDIUM, or LOW based on image clarity"
}
If a field cannot be determined, set it to null.
Return ONLY the JSON object, no additional text."""
    image_part = {"mime_type": mime_type, "data": image_base64}
    try:
        response = model.generate_content([prompt, image_part])
        text = re.sub(r"```json?\n?|\n?```", "", response.text).strip()
        return json.loads(text)
    except Exception:
        raise_error("AI_PROCESSING_FAILED", "Failed to scan student ID card")
