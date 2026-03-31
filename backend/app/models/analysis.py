"""
TruthLens - Analysis ORM Model
Stores every credibility analysis result in PostgreSQL.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ── Input ─────────────────────────────────────────────────────────────────
    content          = Column(Text, nullable=False)
    source_url       = Column(String, nullable=True)

    # ── AI / ML Results ───────────────────────────────────────────────────────
    verdict          = Column(String, nullable=False)          # FAKE | REAL | MISLEADING | UNCERTAIN
    confidence       = Column(Float, nullable=False)           # 0–100
    credibility_score = Column(Float, nullable=False)          # 0–100
    explanation      = Column(Text, nullable=False)
    ai_enhanced = Column(Boolean, nullable=False, default=False)
    # ── NLP Breakdown ─────────────────────────────────────────────────────────
    keywords         = Column(JSON, default=list)              # List[str]
    sentiment        = Column(String, nullable=False)          # positive | negative | neutral
    sentiment_score  = Column(Float, nullable=False)           # -1.0 to 1.0
    bias_indicators  = Column(JSON, default=list)              # List[str]

    created_at       = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationship back to user
    user = relationship("User", back_populates="analyses")

    def __repr__(self):
        return f"<Analysis id={self.id} verdict={self.verdict} score={self.credibility_score}>"
