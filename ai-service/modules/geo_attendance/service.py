from utils.haversine import calculate_distance
from modules.geo_attendance.schemas import GeoAttendanceRequest, GeoAttendanceResponse

def check_attendance(data: GeoAttendanceRequest) -> GeoAttendanceResponse:
    distance = calculate_distance(data.userLat, data.userLng, data.activityLat, data.activityLng)
    within_range = distance <= data.radiusMeters
    return GeoAttendanceResponse(
        withinRange=within_range,
        distance=round(distance, 2),
        allowed=within_range,
        radiusMeters=data.radiusMeters,
    )
