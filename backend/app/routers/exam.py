"""
Mock Exam Router - Full IELTS speaking exam simulation.
"""

from fastapi import APIRouter, Depends, HTTPException
import json
import aiosqlite

from ..database.db import get_db
from ..database import crud
from ..models.schemas import (
    ExamStartRequest, ExamStartResponse,
    ExamRespondRequest, ExamRespondResponse,
    ExamEndRequest, ExamReport
)
from ..services.llm_service import call_llm, call_llm_json
from ..services.prompt_templates import get_examiner_prompt, get_scoring_prompt

router = APIRouter(prefix="/api/exam", tags=["exam"])


@router.post("/start", response_model=ExamStartResponse)
async def start_exam(request: ExamStartRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Start a new mock exam session."""
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    # Create exam session
    session_id = await crud.create_exam_session(db)

    # Get random topics for the exam
    topics = await crud.get_random_topics(db)
    if not topics.get("part1"):
        raise HTTPException(status_code=404, detail="No topics available. Please add topics first.")

    # Generate ID check / first question
    prompt = get_examiner_prompt("part1_intro", "")

    try:
        first_question = await call_llm(
            prompt=prompt,
            api_key=request.api_key,
            model=request.model,
            base_url=request.base_url,
            system_prompt="You are a professional IELTS speaking examiner conducting a test.",
        )

        # Store initial transcript with exam setup
        exam_data = {
            "topics": {
                "part1": topics.get("part1"),
                "part2_3": topics.get("part2_3"),
            },
            "current_part": "part1",
            "current_question_index": 0,
            "target_score": request.target_score,
        }

        transcript = [
            {"role": "system", "content": json.dumps(exam_data)},
            {"role": "examiner", "content": first_question},
        ]
        await crud.update_exam_transcript(db, session_id, transcript)

        return ExamStartResponse(
            session_id=session_id,
            first_question=first_question,
            part="part1",
            topic=topics["part1"]["title"] if topics.get("part1") else "",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/respond", response_model=ExamRespondResponse)
async def exam_respond(request: ExamRespondRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Process user's response and get examiner's next question."""
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    # Get session
    session = await crud.get_exam_session(db, request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")

    transcript = session["transcript"]

    # Add user response to transcript
    transcript.append({
        "role": "candidate",
        "content": request.user_response,
        "part": request.current_part,
    })

    # Build conversation context
    exam_data = json.loads(transcript[0]["content"]) if transcript[0]["role"] == "system" else {}
    topics = exam_data.get("topics", {})

    # Determine conversation context for the examiner
    context_messages = "\n".join([
        f"{'Examiner' if t['role'] == 'examiner' else 'Candidate'}: {t['content']}"
        for t in transcript if t['role'] in ('examiner', 'candidate')
    ])

    # Get next question from topic if available
    current_part = request.current_part
    next_question = None

    part1_topic = topics.get("part1", {})
    part2_3_topic = topics.get("part2_3", {})

    q_index = exam_data.get("current_question_index", 0)
    part1_questions = part1_topic.get("questions", []) if part1_topic else []
    part2_3_questions = part2_3_topic.get("questions", []) if part2_3_topic else []

    if current_part == "part1" and q_index < len(part1_questions):
        next_question = part1_questions[q_index]["text"]
        exam_data["current_question_index"] = q_index + 1

    # Generate examiner response
    prompt = get_examiner_prompt(current_part, context_messages, next_question)

    try:
        examiner_response = await call_llm(
            prompt=prompt,
            api_key=request.api_key,
            model=request.model,
            base_url=request.base_url,
            system_prompt="You are a professional IELTS speaking examiner conducting a test. Only speak as the examiner.",
        )

        # Add examiner response to transcript
        transcript.append({
            "role": "examiner",
            "content": examiner_response,
            "part": current_part,
        })

        # Determine if we need to transition parts
        response_data = ExamRespondResponse(
            examiner_response=examiner_response,
            next_part=None,
            is_exam_over=False,
        )

        # Update transcript
        transcript[0]["content"] = json.dumps(exam_data)
        await crud.update_exam_transcript(db, request.session_id, transcript)

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transition-part", response_model=ExamRespondResponse)
async def transition_part(request: ExamRespondRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Transition to the next exam part (Part 1 -> Part 2 -> Part 3)."""
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    session = await crud.get_exam_session(db, request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")

    transcript = session["transcript"]
    exam_data = json.loads(transcript[0]["content"]) if transcript[0]["role"] == "system" else {}
    topics = exam_data.get("topics", {})
    part2_3_topic = topics.get("part2_3", {})

    next_part = request.current_part
    cue_card = None

    if next_part == "part2":
        # Transition to Part 2
        questions = part2_3_topic.get("questions", [])
        cue_card_text = questions[0]["text"] if questions else "Describe something interesting."
        prompt = get_examiner_prompt("part2_intro", "", cue_card_text)
        cue_card = cue_card_text
    elif next_part == "part3":
        # Transition to Part 3
        part2_topic_title = part2_3_topic.get("title", "")
        prompt = get_examiner_prompt("part3_intro", "", part2_topic_title)
    else:
        raise HTTPException(status_code=400, detail="Invalid part transition")

    try:
        examiner_response = await call_llm(
            prompt=prompt,
            api_key=request.api_key,
            model=request.model,
            base_url=request.base_url,
            system_prompt="You are a professional IELTS speaking examiner conducting a test.",
        )

        transcript.append({
            "role": "examiner",
            "content": examiner_response,
            "part": next_part,
        })

        exam_data["current_part"] = next_part
        exam_data["current_question_index"] = 1  # Reset for new part
        transcript[0]["content"] = json.dumps(exam_data)
        await crud.update_exam_transcript(db, request.session_id, transcript)

        return ExamRespondResponse(
            examiner_response=examiner_response,
            next_part=next_part,
            is_exam_over=False,
            cue_card=cue_card,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/end", response_model=ExamReport)
async def end_exam(request: ExamEndRequest, db: aiosqlite.Connection = Depends(get_db)):
    """End the exam and generate a comprehensive scoring report."""
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    session = await crud.get_exam_session(db, request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")

    transcript = session["transcript"]

    # Build full transcript text
    full_transcript = "\n".join([
        f"{'Examiner' if t['role'] == 'examiner' else 'Candidate'}: {t['content']}"
        for t in transcript if t['role'] in ('examiner', 'candidate')
    ])

    # Generate scoring
    prompt = get_scoring_prompt(full_transcript, request.target_score)

    try:
        report = await call_llm_json(
            prompt=prompt,
            api_key=request.api_key,
            model=request.model,
            base_url=request.base_url,
            system_prompt="You are an experienced IELTS examiner providing detailed scoring and feedback. Always respond in valid JSON.",
        )

        # Save report
        await crud.complete_exam_session(db, request.session_id, report)

        return ExamReport(**report)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
