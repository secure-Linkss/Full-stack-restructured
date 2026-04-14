import requests
import logging

logger = logging.getLogger(__name__)

def get_geo_info(ip_address):
    """
    Get geographic information for an IP address.
    Uses ip-api.com free tier. In production, use MaxMind GeoLite2 or a paid API.
    """
    if not ip_address or ip_address in ('127.0.0.1', '::1', 'localhost'):
        return {
            'country': 'Localhost',
            'countryCode': 'LO',
            'regionName': 'Local',
            'city': 'Local',
            'zip': '00000',
            'timezone': 'UTC',
            'isp': 'Local ISP',
            'org': 'Local Org',
            'as': 'AS0000',
            'lat': 0.0,
            'lon': 0.0
        }

    try:
        url = f"http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return data
            else:
                logger.warning(f"GeoIP API error for {ip_address}: {data.get('message')}")
    except Exception as e:
        logger.error(f"GeoIP error: {e}")

    return {
        'country': 'Unknown',
        'regionName': 'Unknown',
        'city': 'Unknown',
        'zip': 'Unknown',
        'timezone': 'UTC',
        'isp': 'Unknown',
        'org': 'Unknown',
        'as': 'Unknown',
        'lat': 0.0,
        'lon': 0.0
    }
