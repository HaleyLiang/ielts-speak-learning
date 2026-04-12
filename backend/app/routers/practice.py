"""
Practice Mode Router - AI-guided answer generation and practice.
"""

from fastapi import APIRouter, Depends, HTTPException
import aiosqlite

from ..database.db import get_db
from ..database import crud
from ..models.schemas import (
    PracticeDrawResponse, GenerateAnswerRequest, GenerateAnswerResponse,
    CompareAnswerRequest, CompareAnswerResponse
)
from ..services.llm_service import call_llm_json
from ..services.prompt_templates import get_practice_prompt, get_compare_prompt

router = APIRouter(prefix="/api/practice", tags=["practice"])


@router.post("/random-topics", response_model=PracticeDrawResponse)
async def draw_random_topics(db: aiosqlite.Connection = Depends(get_db)):
    """Randomly draw one Part 1 and one Part 2&3 topic for practice."""
    topics = await crud.get_random_topics(db)

    if not topics.get("part1") or not topics.get("part2_3"):
        raise HTTPException(
            status_code=404,
            detail="Not enough topics in the database. Please add at least one Part 1 and one Part 2&3 topic."
        )

    return PracticeDrawResponse(
        part1_topic=topics["part1"],
        part2_3_topic=topics["part2_3"]
    )


@router.post("/generate-answer", response_model=GenerateAnswerResponse)
async def generate_answer(request: GenerateAnswerRequest):
    """Use LLM to generate a personalized IELTS answer based on user's ideas."""
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    prompt = get_practice_prompt(
        question=request.question_text,
        user_input=request.user_input,
        target_score=request.target_score,
        part=request.part,
    )

    try:
        result = await call_llm_json(
            prompt=prompt,
            api_key=request.api_key,
            model=request.model,
            base_url=request.base_url,
        )

        return GenerateAnswerResponse(
            answer_text=result.get("answer_text", ""),
            key_phrases=result.get("key_phrases", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare", response_model=CompareAnswerResponse)
async def compare_answer(request: CompareAnswerRequest):
    """Compare user's spoken answer with the reference and provide feedback."""
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    prompt = get_compare_prompt(
        question="",  # We use the reference answer as context
        user_spoken=request.user_spoken_text,
        reference_answer=request.reference_answer,
        target_score=request.target_score,
    )

    try:
        result = await call_llm_json(
            prompt=prompt,
            api_key=request.api_key,
            model=request.model,
            base_url=request.base_url,
        )

        return CompareAnswerResponse(
            feedback=result.get("feedback", ""),
            fluency_score=result.get("fluency_score", 0),
            vocabulary_score=result.get("vocabulary_score", 0),
            suggestions=result.get("suggestions", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
