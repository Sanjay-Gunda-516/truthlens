"""
TruthLens - Analysis Pydantic Schemas
Request/response models for /analyze and /dashboard endpoints.
"""
from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List


class AnalysisRequest(BaseModel):
    """Body for POST /analyze"""
    content: str
    source_url: Optional[str] = None

    @field_validator("content")
    @classmethod
    def must_be_long_enough(cls, v: str) -> str:
        if len(v.strip()) < 20:
            raise ValueError("Content must be at least 20 characters long.")
        return v.strip()


class AnalysisResponse(BaseModel):
    """Full analysis result returned to the client."""
    id: int
    content: str
    source_url: Optional[str]
    verdict: str
    confidence: float
    credibility_score: float
    explanation: str
    keywords: List[str]
    sentiment: str
    sentiment_score: float
    bias_indicators: List[str]
    ai_enhanced:bool
    created_at: datetime


    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    """Aggregate statistics for the dashboard charts."""
    total: int
    verdict_counts: dict
    avg_confidence: float
    avg_credibility: float
    sentiment_distribution: dict
    recent_trend: List[dict]
