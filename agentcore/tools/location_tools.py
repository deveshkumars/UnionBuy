"""
Geospatial tools for location-based calculations.
Used by Agent 1 (Bulk Approval) and Agent 3 (Security Check).
"""

import math
from typing import Optional

from models.schemas import Location, UserLocation


# Earth's radius in miles
EARTH_RADIUS_MILES = 3958.8


def calculate_distance(loc1: Location, loc2: Location) -> float:
    """
    Calculate the distance between two locations using the Haversine formula.
    
    Args:
        loc1: First location
        loc2: Second location
        
    Returns:
        Distance in miles
    """
    lat1, lon1 = math.radians(loc1.latitude), math.radians(loc1.longitude)
    lat2, lon2 = math.radians(loc2.latitude), math.radians(loc2.longitude)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return EARTH_RADIUS_MILES * c


def calculate_centroid(user_locations: list[UserLocation]) -> Location:
    """
    Calculate the weighted centroid of user locations.
    
    Each user's location is weighted by their requested quantity,
    so users ordering more have more influence on the drop zone.
    
    Args:
        user_locations: List of user locations with quantities
        
    Returns:
        Centroid location (optimal drop zone)
    """
    if not user_locations:
        raise ValueError("Cannot calculate centroid of empty list")
    
    total_weight = sum(ul.quantity for ul in user_locations)
    
    if total_weight == 0:
        raise ValueError("Total weight cannot be zero")
    
    weighted_lat = sum(
        ul.location.latitude * ul.quantity for ul in user_locations
    ) / total_weight
    
    weighted_lon = sum(
        ul.location.longitude * ul.quantity for ul in user_locations
    ) / total_weight
    
    return Location(
        latitude=round(weighted_lat, 6),
        longitude=round(weighted_lon, 6),
        address="Calculated Drop Zone"
    )


def calculate_geographic_spread(user_locations: list[UserLocation]) -> dict:
    """
    Calculate the geographic spread of user locations.
    
    This determines if users are close enough together for
    efficient bulk delivery.
    
    Args:
        user_locations: List of user locations
        
    Returns:
        Dictionary with spread statistics
    """
    if len(user_locations) < 2:
        return {
            "max_distance": 0.0,
            "avg_distance_from_centroid": 0.0,
            "centroid": user_locations[0].location if user_locations else None,
            "user_count": len(user_locations)
        }
    
    centroid = calculate_centroid(user_locations)
    
    # Calculate distances from centroid
    distances_from_centroid = [
        calculate_distance(ul.location, centroid)
        for ul in user_locations
    ]
    
    # Calculate all pairwise distances to find maximum spread
    max_distance = 0.0
    for i, ul1 in enumerate(user_locations):
        for ul2 in user_locations[i + 1:]:
            dist = calculate_distance(ul1.location, ul2.location)
            max_distance = max(max_distance, dist)
    
    avg_distance = sum(distances_from_centroid) / len(distances_from_centroid)
    
    return {
        "max_distance": round(max_distance, 2),
        "avg_distance_from_centroid": round(avg_distance, 2),
        "centroid": centroid,
        "user_count": len(user_locations),
        "distances_from_centroid": [round(d, 2) for d in distances_from_centroid]
    }


def is_within_radius(
    location: Location,
    center: Location,
    radius_miles: float
) -> bool:
    """
    Check if a location is within a given radius of a center point.
    
    Args:
        location: Location to check
        center: Center point
        radius_miles: Radius in miles
        
    Returns:
        True if location is within radius
    """
    distance = calculate_distance(location, center)
    return distance <= radius_miles


def find_outliers(
    user_locations: list[UserLocation],
    max_distance_miles: float
) -> list[str]:
    """
    Find users who are too far from the group centroid.
    
    Args:
        user_locations: List of user locations
        max_distance_miles: Maximum allowed distance from centroid
        
    Returns:
        List of user IDs who are outliers
    """
    if len(user_locations) < 2:
        return []
    
    centroid = calculate_centroid(user_locations)
    outliers = []
    
    for ul in user_locations:
        distance = calculate_distance(ul.location, centroid)
        if distance > max_distance_miles:
            outliers.append(ul.user_id)
    
    return outliers


# Tool decorator pattern for Strands Agents SDK
def tool(func):
    """Decorator to mark a function as a tool for Strands Agents."""
    func._is_tool = True
    func._tool_name = func.__name__
    return func


# Mark functions as tools
calculate_distance = tool(calculate_distance)
calculate_centroid = tool(calculate_centroid)
calculate_geographic_spread = tool(calculate_geographic_spread)
is_within_radius = tool(is_within_radius)
find_outliers = tool(find_outliers)

