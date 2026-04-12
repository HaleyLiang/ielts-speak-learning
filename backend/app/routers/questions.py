"""
Question Bank Router - CRUD operations for topics and questions.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import json
import csv
import io
import aiosqlite

from ..database.db import get_db
from ..database import crud
from ..models.schemas import (
    TopicCreate, TopicOut, TopicListItem, ImportData,
    QuestionCreate, SaveAnswerRequest
)

router = APIRouter(prefix="/api/questions", tags=["questions"])


@router.get("/topics", response_model=List[TopicListItem])
async def list_topics(db: aiosqlite.Connection = Depends(get_db)):
    """List all topics with preparation status."""
    topics = await crud.get_all_topics(db)
    return topics


@router.get("/topics/{topic_id}", response_model=TopicOut)
async def get_topic(topic_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Get a topic with all questions and personal answers."""
    topic = await crud.get_topic_with_questions(db, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.post("/topics", response_model=dict)
async def create_topic(topic: TopicCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Create a new topic with optional questions."""
    questions = [{"text": q.text} for q in topic.questions]
    topic_id = await crud.create_topic(db, topic.title, topic.part, questions)
    return {"id": topic_id, "message": "Topic created successfully"}


@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a topic and all its questions/answers."""
    success = await crud.delete_topic(db, topic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted successfully"}


@router.post("/topics/{topic_id}/questions", response_model=dict)
async def add_question(topic_id: int, question: QuestionCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Add a question to a topic."""
    question_id = await crud.add_question(db, topic_id, question.text)
    return {"id": question_id, "message": "Question added successfully"}


@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """Delete a question."""
    success = await crud.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}


@router.put("/answers", response_model=dict)
async def save_answer(request: SaveAnswerRequest, db: aiosqlite.Connection = Depends(get_db)):
    """Save or update a personal answer for a question."""
    answer_id = await crud.save_personal_answer(
        db,
        question_id=request.question_id,
        answer_text=request.answer_text,
        key_phrases=request.key_phrases,
        target_score=request.target_score,
    )
    return {"id": answer_id, "message": "Answer saved successfully"}


@router.post("/import", response_model=dict)
async def import_questions(data: ImportData, db: aiosqlite.Connection = Depends(get_db)):
    """Bulk import topics with questions from JSON."""
    topics_data = [t.model_dump() for t in data.topics]
    count = await crud.bulk_import_topics(db, topics_data)
    return {"imported": count, "message": f"Successfully imported {count} topics"}


@router.post("/import-file", response_model=dict)
async def import_file(file: UploadFile = File(...), db: aiosqlite.Connection = Depends(get_db)):
    """Import topics from uploaded JSON or CSV file."""
    content = await file.read()
    text = content.decode("utf-8")

    if file.filename.endswith(".json"):
        data = json.loads(text)
        if isinstance(data, list):
            topics_data = data
        elif "topics" in data:
            topics_data = data["topics"]
        else:
            raise HTTPException(status_code=400, detail="Invalid JSON format")
    elif file.filename.endswith(".csv"):
        reader = csv.DictReader(io.StringIO(text))
        topics_map = {}
        for row in reader:
            key = (row.get("title", ""), row.get("part", "part1"))
            if key not in topics_map:
                topics_map[key] = {"title": key[0], "part": key[1], "questions": []}
            if row.get("question"):
                topics_map[key]["questions"].append({"text": row["question"]})
        topics_data = list(topics_map.values())
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use JSON or CSV.")

    count = await crud.bulk_import_topics(db, topics_data)
    return {"imported": count, "message": f"Successfully imported {count} topics"}
