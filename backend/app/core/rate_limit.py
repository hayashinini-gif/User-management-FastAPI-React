import time
from collections import defaultdict, deque
from math import ceil
from typing import Deque, Dict

from fastapi import Depends, HTTPException, status

from app.core.dependencies import get_current_admin_user
from app.models.user import User

# Tuning. Generous for a human typing sentences; ruinous for a script.
PER_MINUTE = 10
PER_DAY = 200

MINUTE = 60.0
DAY = 24 * 60 * 60.0

# user_id -> timestamps of recent AI calls, oldest first.
# In-memory on purpose: see the note below about what that costs us.
_calls: Dict[int, Deque[float]] = defaultdict(deque)


def ai_rate_limit(
    current_user: User = Depends(get_current_admin_user),
) -> User:
    """
    Chains onto the admin check, so a route using this gets authentication,
    authorization and rate limiting from one dependency. Returns the user so
    the route can still use it.
    """
    now = time.monotonic()
    hits = _calls[current_user.id]

    # Drop anything older than the longest window we care about.
    while hits and now - hits[0] > DAY:
        hits.popleft()

    recent = [t for t in hits if now - t <= MINUTE]
    if len(recent) >= PER_MINUTE:
        wait = ceil(MINUTE - (now - recent[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many AI requests. Try again in {wait} seconds.",
            headers={"Retry-After": str(wait)},
        )

    if len(hits) >= PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily AI request limit reached. The filters below still work.",
            headers={"Retry-After": "3600"},
        )

    hits.append(now)
    return current_user