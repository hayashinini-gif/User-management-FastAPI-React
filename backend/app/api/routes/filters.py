from fastapi import APIRouter, Depends, HTTPException, status

from app.core.rate_limit import ai_rate_limit
from app.models.user import User
from app.schemas.filters import FilterQueryRequest, FilterSuggestion
from app.services.ai_filters import AIUnavailable, AIUnintelligible, interpret

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/interpret-filters", response_model=FilterSuggestion)
def interpret_filters(
    payload: FilterQueryRequest,
    current_user: User = Depends(ai_rate_limit),
) -> FilterSuggestion:
    """
    Natural language in, validated filter parameters out.

    Note what is NOT in this signature: there is no `db: Session`. This route
    cannot read or modify a single user, no matter what the model returns.
    That is what makes "the AI never touches the database" structural rather
    than a promise someone has to remember to keep.

    `ai_rate_limit` chains onto `get_current_admin_user`, so authentication,
    the admin check and the rate limit all happen before this body runs.
    """
    try:
        return interpret(payload.query)

    except AIUnintelligible:
        # The model answered with something unusable. The admin's phrasing is
        # the most likely cause, so steer them rather than blaming the system.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not turn that into filters. Try naming a role, a status, or a name.",
        )

    except AIUnavailable:
        # Deliberately generic. The real reason — a timeout, an expired key,
        # an empty credit balance — is logged in ai_filters.py and stays there.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI filter service is unavailable right now. The filters below still work.",
        )