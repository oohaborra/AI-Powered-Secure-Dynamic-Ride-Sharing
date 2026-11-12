
def protect_location(latitude, longitude, precision=2):
    """
    Reduce GPS coordinate precision to protect user privacy.
    """
    protected_latitude = round(latitude, precision)
    protected_longitude = round(longitude, precision)

    return {
        "original_location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "protected_location": {
            "latitude": protected_latitude,
            "longitude": protected_longitude
        }
    }


# Example GPS coordinates
latitude = 16.5062
longitude = 80.6480

result = protect_location(latitude, longitude)

print("Original Location:", result["original_location"])
print("Protected Location:", result["protected_location"])
