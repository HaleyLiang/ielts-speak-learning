"""
CRUD operations for the IELTS Speaking Practice App database.
"""

import aiosqlite
import json
from typing import List, Optional


async def get_all_topics(db: aiosqlite.Connection) -> List[dict]:
    """Get all topics with preparation status."""
    cursor = await db.execute("""
        SELECT 
            t.id, t.title, t.part, t.created_at,
            COUNT(q.id) as total_count,
            COUNT(pa.id) as prepared_count
        FROM topics t
        LEFT JOIN questions q ON q.topic_id = t.id
        LEFT JOIN personal_answers pa ON pa.question_id = q.id
        GROUP BY t.id
        ORDER BY t.part, t.title
    """)
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_topic_with_questions(db: aiosqlite.Connection, topic_id: int) -> Optional[dict]:
    """Get a single topic with all its questions and answers."""
    cursor = await db.execute(
        "SELECT id, title, part, created_at FROM topics WHERE id = ?",
        (topic_id,)
    )
    topic_row = await cursor.fetchone()
    if not topic_row:
        return None

    topic = dict(topic_row)

    cursor = await db.execute("""
        SELECT 
            q.id, q.topic_id, q.text, q.sort_order,
            pa.id as pa_id, pa.answer_text, pa.key_phrases, pa.target_score,
            pa.created_at as pa_created_at, pa.updated_at as pa_updated_at
        FROM questions q
        LEFT JOIN personal_answers pa ON pa.question_id = q.id
        WHERE q.topic_id = ?
        ORDER BY q.sort_order
    """, (topic_id,))
    question_rows = await cursor.fetchall()

    questions = []
    prepared_count = 0
    for qr in question_rows:
        qr = dict(qr)
        q = {
            "id": qr["id"],
            "topic_id": qr["topic_id"],
            "text": qr["text"],
            "sort_order": qr["sort_order"],
            "personal_answer": None
        }
        if qr["pa_id"]:
            prepared_count += 1
            q["personal_answer"] = {
                "id": qr["pa_id"],
                "answer_text": qr["answer_text"],
                "key_phrases": qr["key_phrases"],
                "target_score": qr["target_score"],
                "created_at": qr["pa_created_at"],
                "updated_at": qr["pa_updated_at"],
            }
        questions.append(q)

    topic["questions"] = questions
    topic["total_count"] = len(questions)
    topic["prepared_count"] = prepared_count
    return topic


async def create_topic(db: aiosqlite.Connection, title: str, part: str, questions: List[dict] = None) -> int:
    """Create a new topic with optional questions."""
    cursor = await db.execute(
        "INSERT INTO topics (title, part) VALUES (?, ?)",
        (title, part)
    )
    topic_id = cursor.lastrowid

    if questions:
        for i, q in enumerate(questions):
            await db.execute(
                "INSERT INTO questions (topic_id, text, sort_order) VALUES (?, ?, ?)",
                (topic_id, q.get("text", q), i)
            )

    await db.commit()
    return topic_id


async def delete_topic(db: aiosqlite.Connection, topic_id: int) -> bool:
    """Delete a topic and its questions/answers."""
    cursor = await db.execute("DELETE FROM topics WHERE id = ?", (topic_id,))
    await db.commit()
    return cursor.rowcount > 0


async def add_question(db: aiosqlite.Connection, topic_id: int, text: str) -> int:
    """Add a question to a topic."""
    cursor = await db.execute(
        "SELECT MAX(sort_order) as max_order FROM questions WHERE topic_id = ?",
        (topic_id,)
    )
    row = await cursor.fetchone()
    next_order = (row[0] or 0) + 1

    cursor = await db.execute(
        "INSERT INTO questions (topic_id, text, sort_order) VALUES (?, ?, ?)",
        (topic_id, text, next_order)
    )
    await db.commit()
    return cursor.lastrowid


async def delete_question(db: aiosqlite.Connection, question_id: int) -> bool:
    """Delete a question."""
    cursor = await db.execute("DELETE FROM questions WHERE id = ?", (question_id,))
    await db.commit()
    return cursor.rowcount > 0


async def save_personal_answer(
    db: aiosqlite.Connection,
    question_id: int,
    answer_text: str,
    key_phrases: str = None,
    target_score: float = None
) -> int:
    """Save or update a personal answer for a question."""
    cursor = await db.execute(
        "SELECT id FROM personal_answers WHERE question_id = ?",
        (question_id,)
    )
    existing = await cursor.fetchone()

    if existing:
        await db.execute("""
            UPDATE personal_answers 
            SET answer_text = ?, key_phrases = ?, target_score = ?, updated_at = CURRENT_TIMESTAMP
            WHERE question_id = ?
        """, (answer_text, key_phrases, target_score, question_id))
        answer_id = existing[0]
    else:
        cursor = await db.execute("""
            INSERT INTO personal_answers (question_id, answer_text, key_phrases, target_score)
            VALUES (?, ?, ?, ?)
        """, (question_id, answer_text, key_phrases, target_score))
        answer_id = cursor.lastrowid

    await db.commit()
    return answer_id


async def get_random_topics(db: aiosqlite.Connection) -> dict:
    """Get one random Part 1 topic and one random Part 2&3 topic."""
    cursor = await db.execute(
        "SELECT id FROM topics WHERE part = 'part1' ORDER BY RANDOM() LIMIT 1"
    )
    part1_row = await cursor.fetchone()

    cursor = await db.execute(
        "SELECT id FROM topics WHERE part = 'part2_3' ORDER BY RANDOM() LIMIT 1"
    )
    part2_row = await cursor.fetchone()

    result = {}
    if part1_row:
        result["part1"] = await get_topic_with_questions(db, part1_row[0])
    if part2_row:
        result["part2_3"] = await get_topic_with_questions(db, part2_row[0])

    return result


async def bulk_import_topics(db: aiosqlite.Connection, topics_data: List[dict]) -> int:
    """Bulk import topics with questions."""
    count = 0
    for topic_data in topics_data:
        questions = [{"text": q["text"]} for q in topic_data.get("questions", [])]
        await create_topic(db, topic_data["title"], topic_data["part"], questions)
        count += 1
    return count


async def create_exam_session(db: aiosqlite.Connection) -> int:
    """Create a new exam session."""
    cursor = await db.execute(
        "INSERT INTO exam_sessions (status, transcript) VALUES ('in_progress', '[]')"
    )
    await db.commit()
    return cursor.lastrowid


async def update_exam_transcript(db: aiosqlite.Connection, session_id: int, transcript: list):
    """Update exam session transcript."""
    await db.execute(
        "UPDATE exam_sessions SET transcript = ? WHERE id = ?",
        (json.dumps(transcript), session_id)
    )
    await db.commit()


async def get_exam_session(db: aiosqlite.Connection, session_id: int) -> Optional[dict]:
    """Get exam session."""
    cursor = await db.execute(
        "SELECT * FROM exam_sessions WHERE id = ?",
        (session_id,)
    )
    row = await cursor.fetchone()
    if row:
        result = dict(row)
        result["transcript"] = json.loads(result["transcript"] or "[]")
        return result
    return None


async def complete_exam_session(db: aiosqlite.Connection, session_id: int, report: dict):
    """Mark exam session as completed with report."""
    await db.execute("""
        UPDATE exam_sessions 
        SET status = 'completed', report = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (json.dumps(report), session_id))
    await db.commit()
