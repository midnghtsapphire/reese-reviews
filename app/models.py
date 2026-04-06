import uuid
from datetime import datetime, date
from typing import Optional
from enum import Enum as PyEnum

from sqlalchemy import (
    String, Float, Text, DateTime, Date, ForeignKey, JSON, Enum as SAEnum, Integer
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, Field
from app.database import Base


# ── Enums ──────────────────────────────────────────────────────────────────────

class OrderCategory(str, PyEnum):
    electronics = "electronics"
    beauty = "beauty"
    kitchen = "kitchen"
    fitness = "fitness"
    pets = "pets"
    home = "home"
    other = "other"


class ReviewPersona(str, PyEnum):
    reese = "reese"
    audrey = "audrey"
    custom = "custom"


class ReviewTone(str, PyEnum):
    enthusiastic = "enthusiastic"
    balanced = "balanced"
    critical = "critical"


class JobStatus(str, PyEnum):
    queued = "queued"
    researching = "researching"
    generating = "generating"
    awaiting_approval = "awaiting_approval"
    synthesizing = "synthesizing"
    rendering = "rendering"
    assembling = "assembling"
    distributing = "distributing"
    done = "done"
    failed = "failed"
    rejected = "rejected"


# ── SQLAlchemy ORM ─────────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    order_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    product_name: Mapped[str] = mapped_column(String(512), nullable=False)
    asin: Mapped[Optional[str]] = mapped_column(String(20))
    product_url: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[Optional[str]] = mapped_column(
        SAEnum(OrderCategory, name="order_category"), default=OrderCategory.other
    )
    purchase_price: Mapped[Optional[float]] = mapped_column(Float)
    purchase_date: Mapped[Optional[date]] = mapped_column(Date)
    usage_notes: Mapped[Optional[str]] = mapped_column(Text)
    review_persona: Mapped[str] = mapped_column(
        SAEnum(ReviewPersona, name="review_persona"), default=ReviewPersona.reese
    )
    review_tone: Mapped[str] = mapped_column(
        SAEnum(ReviewTone, name="review_tone"), default=ReviewTone.balanced
    )
    target_platform: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    affiliate_tag: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="order", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    job_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.order_id"), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(JobStatus, name="job_status"), default=JobStatus.queued
    )
    stage_statuses: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    review_text: Mapped[Optional[str]] = mapped_column(Text)
    review_script: Mapped[Optional[str]] = mapped_column(Text)
    star_rating: Mapped[Optional[float]] = mapped_column(Float)
    audio_url: Mapped[Optional[str]] = mapped_column(Text)
    image_urls: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    video_url: Mapped[Optional[str]] = mapped_column(Text)
    final_asset_url: Mapped[Optional[str]] = mapped_column(Text)
    telegram_notified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    order: Mapped["Order"] = relationship("Order", back_populates="jobs")
    errors: Mapped[list["JobError"]] = relationship("JobError", back_populates="job", cascade="all, delete-orphan")
    costs: Mapped[list["JobCost"]] = relationship("JobCost", back_populates="job", cascade="all, delete-orphan")


class JobError(Base):
    __tablename__ = "errors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.job_id"), nullable=False)
    stage: Mapped[Optional[str]] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text)
    stack_trace: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    job: Mapped["Job"] = relationship("Job", back_populates="errors")


class JobCost(Base):
    __tablename__ = "job_costs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.job_id"), nullable=False)
    stage: Mapped[Optional[str]] = mapped_column(String(50))
    service: Mapped[Optional[str]] = mapped_column(String(100))
    amount_usd: Mapped[float] = mapped_column(Float, default=0.0)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    job: Mapped["Job"] = relationship("Job", back_populates="costs")


# ── Pydantic schemas ───────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    product_name: str
    asin: Optional[str] = None
    product_url: Optional[str] = None
    category: OrderCategory = OrderCategory.other
    purchase_price: Optional[float] = None
    purchase_date: Optional[date] = None
    usage_notes: Optional[str] = None
    review_persona: ReviewPersona = ReviewPersona.reese
    review_tone: ReviewTone = ReviewTone.balanced
    target_platform: list[str] = Field(default_factory=list)
    affiliate_tag: Optional[str] = None


class OrderOut(BaseModel):
    order_id: str
    product_name: str
    asin: Optional[str] = None
    product_url: Optional[str] = None
    category: Optional[str] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[date] = None
    usage_notes: Optional[str] = None
    review_persona: str
    review_tone: str
    target_platform: Optional[list] = None
    affiliate_tag: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobOut(BaseModel):
    job_id: str
    order_id: str
    status: str
    stage_statuses: Optional[dict] = None
    review_text: Optional[str] = None
    review_script: Optional[str] = None
    star_rating: Optional[float] = None
    audio_url: Optional[str] = None
    image_urls: Optional[list] = None
    video_url: Optional[str] = None
    final_asset_url: Optional[str] = None
    telegram_notified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
