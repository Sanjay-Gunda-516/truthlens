"""
TruthLens - Dashboard Router
GET /dashboard/stats  →  aggregate analytics for the logged-in user
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.analysis import Analysis
from ..schemas.analysis import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return aggregate stats for all of the current user's analyses.
    Powers the verdict pie chart, sentiment bar chart, and trend line.
    """
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.asc())
        .all()
    )

    total = len(analyses)

    if total == 0:
        return DashboardStats(
            total=0,
            verdict_counts={},
            avg_confidence=0.0,
            avg_credibility=0.0,
            sentiment_distribution={},
            recent_trend=[],
        )

    verdict_counts: dict = {}
    sentiment_dist: dict = {}
    total_confidence = 0.0
    total_credibility = 0.0

    for a in analyses:
        verdict_counts[a.verdict]  = verdict_counts.get(a.verdict, 0)  + 1
        sentiment_dist[a.sentiment] = sentiment_dist.get(a.sentiment, 0) + 1
        total_confidence  += a.confidence
        total_credibility += a.credibility_score

    # Last 10 results for the trend chart
    recent_trend = [
        {
            "date":        a.created_at.strftime("%m/%d"),
            "credibility": round(a.credibility_score, 1),
            "confidence":  round(a.confidence, 1),
            "verdict":     a.verdict,
        }
        for a in analyses[-10:]
    ]

    return DashboardStats(
        total=total,
        verdict_counts=verdict_counts,
        avg_confidence=round(total_confidence / total, 1),
        avg_credibility=round(total_credibility / total, 1),
        sentiment_distribution=sentiment_dist,
        recent_trend=recent_trend,
    )
