from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.stats import (
    UserCountResponse,
    AverageAgeResponse,
    TopCitiesResponse,
    CityStats,
    UserDistributionResponse,
    UserTypeCount
)

router = APIRouter(prefix="/api/stats", tags=["statistics"])

# These describe the user base — how many accounts exist, their average age,
# where they live. That is information about your users, so every endpoint
# here requires a signed-in account. To make them public again, remove the
# get_current_user dependency from the four functions below.


@router.get("/user-count", response_model=UserCountResponse)
def get_user_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get total number of active users"""
    count = db.query(func.count(User.id)).filter(
        User.is_deleted == False
    ).scalar()
    
    return UserCountResponse(total_users=count or 0)


@router.get("/average-age", response_model=AverageAgeResponse)
def get_average_age(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get average age of active users"""
    avg_age = db.query(func.avg(User.age)).filter(
        User.is_deleted == False
    ).scalar()
    
    return AverageAgeResponse(average_age=avg_age)


@router.get("/top-cities", response_model=TopCitiesResponse)
def get_top_cities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get top 5 cities by user count"""
    # Users without a city are not a city — exclude them.
    # Without this filter the NULL group reaches CityStats(city=None),
    # which fails validation and turns this endpoint into a 500.
    cities = db.query(
        User.city,
        func.count(User.id).label('user_count')
    ).filter(
        User.is_deleted == False,
        User.city.isnot(None),
        User.city != ''
    ).group_by(
        User.city
    ).order_by(
        func.count(User.id).desc()
    ).limit(5).all()
    
    city_stats = [
        CityStats(city=city, user_count=count)
        for city, count in cities
    ]
    
    return TopCitiesResponse(top_cities=city_stats)


@router.get("/user-distribution", response_model=UserDistributionResponse)
def get_user_distribution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get count of users by type"""
    distribution = db.query(
        User.type,
        func.count(User.id).label('count')
    ).filter(
        User.is_deleted == False
    ).group_by(
        User.type
    ).order_by(
        func.count(User.id).desc()
    ).all()
    
    type_counts = [
        UserTypeCount(type=user_type, count=count)
        for user_type, count in distribution
    ]
    
    return UserDistributionResponse(distribution=type_counts)