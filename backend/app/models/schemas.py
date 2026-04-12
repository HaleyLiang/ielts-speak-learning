"""
Pydantic schemas for the IELTS Speaking Practice App.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ─── Question Bank Schemas ────────────────────────────────────────

class QuestionBase(BaseModel):
    text: str
    sort_order: int = 0


class QuestionCreate(QuestionBase):
    pass


class PersonalAnswerOut(BaseModel):
    id: int
    answer_text: str
    key_phrases: Optional[str] = None
    target_score: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class QuestionOut(BaseModel):
    id: int
    topic_id: int
    text: str
    sort_order: int
    personal_answer: Optional[PersonalAnswerOut] = None


class TopicBase(BaseModel):
    title: str
    part: str = Field(..., pattern=r"^(part1|part2_3)$")


class TopicCreate(TopicBase):
    questions: List[QuestionCreate] = []


class TopicOut(BaseModel):
    id: int
    title: str
    part: str
    questions: List[QuestionOut] = []
    prepared_count: int = 0
    total_count: int = 0
    created_at: Optional[str] = None


class TopicListItem(BaseModel):
    id: int
    title: str
    part: str
    prepared_count: int = 0
    total_count: int = 0


# ─── Import/Export ────────────────────────────────────────────────

class ImportQuestion(BaseModel):
    text: str


class ImportTopic(BaseModel):
    title: str
    part: str
    questions: List[ImportQuestion]


class ImportData(BaseModel):
    topics: List[ImportTopic]


# ─── Practice Mode Schemas ───────────────────────────────────────

class PracticeDrawRequest(BaseModel):
    """Request to randomly draw topics for practice."""
    pass


class PracticeDrawResponse(BaseModel):
    part1_topic: TopicOut
    part2_3_topic: TopicOut


class GenerateAnswerRequest(BaseModel):
    question_id: int
    question_text: str
    user_input: str
    target_score: float = 6.5
    part: str = "part1"
    api_key: str
    model: str = "gpt-4o-mini"
    base_url: Optional[str] = None


class GenerateAnswerResponse(BaseModel):
    answer_text: str
    key_phrases: List[str] = []


class CompareAnswerRequest(BaseModel):
    question_id: int
    user_spoken_text: str
    reference_answer: str
    target_score: float = 6.5
    api_key: str
    model: str = "gpt-4o-mini"
    base_url: Optional[str] = None


class CompareAnswerResponse(BaseModel):
    feedback: str
    fluency_score: float
    vocabulary_score: float
    suggestions: List[str] = []


# ─── Mock Exam Schemas ───────────────────────────────────────────

class ExamStartRequest(BaseModel):
    api_key: str
    model: str = "gpt-4o-mini"
    target_score: float = 6.5
    base_url: Optional[str] = None


class ExamStartResponse(BaseModel):
    session_id: int
    first_question: str
    part: str = "part1"
    topic: str = ""


class ExamRespondRequest(BaseModel):
    session_id: int
    user_response: str
    current_part: str
    api_key: str
    model: str = "gpt-4o-mini"
    base_url: Optional[str] = None


class ExamRespondResponse(BaseModel):
    examiner_response: str
    next_part: Optional[str] = None
    is_exam_over: bool = False
    cue_card: Optional[str] = None


class ExamEndRequest(BaseModel):
    session_id: int
    target_score: float = 6.5
    api_key: str
    model: str = "gpt-4o-mini"
    base_url: Optional[str] = None


class PartFeedback(BaseModel):
    score: float
    feedback: str
    highlights: List[str] = []


class ExamReport(BaseModel):
    overall_band: float
    gap_analysis: str
    fc_score: float = 0
    lr_score: float = 0
    gra_score: float = 0
    pr_score: float = 0
    part1_feedback: Optional[PartFeedback] = None
    part2_feedback: Optional[PartFeedback] = None
    part3_feedback: Optional[PartFeedback] = None
    grammar_corrections: List[dict] = []
    better_expressions: List[dict] = []


# ─── Settings ────────────────────────────────────────────────────

class SaveAnswerRequest(BaseModel):
    question_id: int
    answer_text: str
    key_phrases: Optional[str] = None
    target_score: Optional[float] = None
