"""
Database models and connection for the IELTS Speaking Practice App.
Uses aiosqlite for async SQLite operations.
"""

import aiosqlite
import os
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "data" / "questions.db"


async def get_db():
    """Get an async database connection."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
    finally:
        await db.close()


async def init_db():
    """Initialize the database schema."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(str(DB_PATH)) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")

        await db.executescript("""
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                part TEXT NOT NULL CHECK(part IN ('part1', 'part2_3')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS personal_answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL UNIQUE,
                answer_text TEXT NOT NULL,
                key_phrases TEXT,
                target_score REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exam_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed')),
                transcript TEXT,
                report TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            );
        """)
        await db.commit()


async def seed_sample_data():
    """Seed the database with sample IELTS questions if empty."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(str(DB_PATH)) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM topics")
        row = await cursor.fetchone()
        if row[0] > 0:
            return

        sample_data = [
            {
                "title": "Hometown",
                "part": "part1",
                "questions": [
                    "Where is your hometown?",
                    "What do you like most about your hometown?",
                    "Is there anything you dislike about it?",
                    "How long have you been living there?",
                ]
            },
            {
                "title": "Work or Studies",
                "part": "part1",
                "questions": [
                    "Do you work or are you a student?",
                    "What do you like about your job/studies?",
                    "Would you like to change your job/field of study?",
                ]
            },
            {
                "title": "Weather",
                "part": "part1",
                "questions": [
                    "What's the weather like in your city?",
                    "Do you prefer hot or cold weather?",
                    "Does the weather affect your mood?",
                ]
            },
            {
                "title": "Describe a person who has influenced you",
                "part": "part2_3",
                "questions": [
                    "Describe a person who has had a great influence on your life. You should say: who this person is, how you know them, what they have done to influence you, and explain why they have had such an influence.",
                    "Do you think famous people have a strong influence on young people?",
                    "How do role models affect children's behavior?",
                    "Is it important for children to have positive role models?",
                ]
            },
            {
                "title": "Describe a place you would like to visit",
                "part": "part2_3",
                "questions": [
                    "Describe a place you have always wanted to visit. You should say: where this place is, how you learned about it, what you would do there, and explain why you want to visit this place.",
                    "Why do people like to travel?",
                    "Do you think tourism has a positive or negative impact on local communities?",
                    "How has travel changed compared to the past?",
                ]
            },
        ]

        for topic_data in sample_data:
            cursor = await db.execute(
                "INSERT INTO topics (title, part) VALUES (?, ?)",
                (topic_data["title"], topic_data["part"])
            )
            topic_id = cursor.lastrowid
            for i, q_text in enumerate(topic_data["questions"]):
                await db.execute(
                    "INSERT INTO questions (topic_id, text, sort_order) VALUES (?, ?, ?)",
                    (topic_id, q_text, i)
                )

        await db.commit()
