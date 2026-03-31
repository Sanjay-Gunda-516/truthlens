"""
TruthLens - Analysis Router
POST   /analyze             →  run ML analysis, save to DB, return result
GET    /analyze/history     →  paginated list of user's past analyses
GET    /analyze/{id}        →  single analysis by ID
DELETE /analyze/{id}        →  delete analysis (owner only)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.analysis import Analysis
from ..schemas.analysis import AnalysisRequest, AnalysisResponse
from ..ml.predictor import analyze_content

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def run_analysis(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run the ML pipeline on submitted content and persist the result."""
    try:
        result = await analyze_content(request.content, request.source_url)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )

    record = Analysis(
        user_id=current_user.id,
        content=request.content,
        source_url=request.source_url,
        **result,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/history", response_model=List[AnalysisResponse])
def get_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's analysis history, newest first."""
    return (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_one(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single analysis by ID (owner only)."""
    record = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return record


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_one(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an analysis (owner only)."""
    record = (
        db.query(Analysis)
        .filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    db.delete(record)
    db.commit()
