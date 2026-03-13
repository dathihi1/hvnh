import sys, base64, json, re, os
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv
load_dotenv()
from config.gemini import get_model

def debug_scan(image_path: str):
    print(f"Reading image: {image_path}")
    with open(image_path, "rb") as f:
        raw = f.read()
    image_base64 = base64.b64encode(raw).decode("utf-8")
    ext = image_path.rsplit(".", 1)[-1].lower()
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    mime_type = mime_map.get(ext, "image/jpeg")
    print(f"Size: {len(raw)/1024:.1f} KB | Base64: {len(image_base64)} chars | MIME: {mime_type}")
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
    print("\nCalling Gemini...")
    try:
        response = model.generate_content([prompt, image_part])
        text = re.sub(r"```json?\n?|\n?```", "", response.text).strip()
        print(f"\nRaw response:\n{text}\n")
        result = json.loads(text)
        print("Extracted info:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"\nError: {type(e).__name__}: {e}")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "test/the_sv1.jpg"
    debug_scan(path)
