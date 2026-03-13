from fastapi import HTTPException

ERROR_CODES = {
    "UNAUTHORIZED_SERVICE":    {"status_code": 401, "message": "Invalid or missing service key"},
    "AI_PROCESSING_FAILED":    {"status_code": 500, "message": "AI processing failed"},
    "AI_INVALID_RESPONSE":     {"status_code": 502, "message": "AI returned an invalid response"},
    "SCAN_IMAGE_REQUIRED":     {"status_code": 400, "message": "Student ID card image is required"},
    "GEO_INVALID_COORDINATES": {"status_code": 400, "message": "Invalid coordinates provided"},
    "VALIDATION_ERROR":        {"status_code": 400, "message": "Invalid input data"},
    "NOT_FOUND":               {"status_code": 404, "message": "Resource not found"},
    "INTERNAL_ERROR":          {"status_code": 500, "message": "Internal server error"},
}

def raise_error(code: str, override_message: str = None):
    definition = ERROR_CODES.get(code, ERROR_CODES["INTERNAL_ERROR"])
    raise HTTPException(
        status_code=definition["status_code"],
        detail={"code": code, "message": override_message or definition["message"]},
    )
