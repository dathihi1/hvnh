from pydantic import BaseModel, Field

class GeoAttendanceRequest(BaseModel):
    userLat: float = Field(..., ge=-90, le=90)
    userLng: float = Field(..., ge=-180, le=180)
    activityLat: float = Field(..., ge=-90, le=90)
    activityLng: float = Field(..., ge=-180, le=180)
    radiusMeters: float = Field(default=200, ge=10, le=10000)

class GeoAttendanceResponse(BaseModel):
    withinRange: bool
    distance: float
    allowed: bool
    radiusMeters: float
