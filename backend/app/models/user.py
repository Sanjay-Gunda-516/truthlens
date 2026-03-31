"""
TruthLens - User ORM Model
Represents the 'users' table in PostgreSQL.
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name     = Column(String, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    # One user → many analyses
    analyses = relationship(
        "Analysis",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"
