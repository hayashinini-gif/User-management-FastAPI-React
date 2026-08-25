from pydantic import BaseModel
from typing import List


class UserCountResponse(BaseModel):
    """Response for total user count"""
    total_users: int


class AverageAgeResponse(BaseModel):
    """Response for average age of users"""
    average_age: float | None  # None if no users


class CityStats(BaseModel):
    """Individual city statistic"""
    city: str
    user_count: int


class TopCitiesResponse(BaseModel):
    """Response for top 5 cities"""
    top_cities: List[CityStats]


class UserTypeCount(BaseModel):
    """Individual user type count"""
    type: str
    count: int


class UserDistributionResponse(BaseModel):
    """Response for user type distribution"""
    distribution: List[UserTypeCount]