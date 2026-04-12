"""
Prompt templates for the IELTS Speaking Practice App.
All templates use the design document's prompt engineering approach
with dynamic [Target Score] injection.
"""


def get_practice_prompt(question: str, user_input: str, target_score: float, part: str = "part1") -> str:
    """Generate the prompt for creating a personalized IELTS answer."""
    word_limit = "60-80 words" if part == "part1" else "180-220 words"

    return f"""你是一位资深的雅思口语前考官。现在我们要为学生定制雅思回答。当前题目是：{question}。学生的真实想法/经历是：{user_input}。
请根据学生的想法，创作一个严格符合雅思口语 {target_score} 分标准的英文回答。
核心要求：
* **词汇与语法定级:** 词汇难度和语法复杂度必须严格锚定 {target_score} 分的真实水平。如果目标分低于7.0，请避免使用过于生僻或华丽的大词，多用自然地道的词组搭配（collocations）；如果目标分大于等于7.0，请适当增加复杂句式和高级词汇。
* **口语化表达:** 保持自然的口语交流感，避免机器味或书面背诵感。
* **长度限制:** 控制在 {word_limit} 以内。

请按以下JSON格式输出，不要包含markdown代码块标记：
{{
  "answer_text": "你生成的英文回答",
  "key_phrases": ["提分重点词汇/短语1", "提分重点词汇/短语2", "提分重点词汇/短语3"]
}}"""


def get_compare_prompt(question: str, user_spoken: str, reference_answer: str, target_score: float) -> str:
    """Generate the prompt for comparing user's spoken answer with the reference."""
    return f"""你是一位雅思口语专家。学生正在练习以下问题的回答。

问题: {question}
参考答案 (目标{target_score}分标准): {reference_answer}
学生的口语回答 (语音转文字): {user_spoken}

请对比参考答案和学生的实际回答，给出以下反馈：
1. 流利度评分 (0-9分，精确到0.5)
2. 词汇使用评分 (0-9分，精确到0.5)  
3. 具体的改进建议（至少3条）
4. 总体反馈

请按以下JSON格式输出，不要包含markdown代码块标记：
{{
  "fluency_score": 6.0,
  "vocabulary_score": 6.0,
  "suggestions": ["建议1", "建议2", "建议3"],
  "feedback": "总体反馈内容"
}}"""


def get_examiner_prompt(part: str, transcript_context: str, next_question: str = None) -> str:
    """Generate the prompt for the AI examiner during mock exam."""
    if part == "part1_intro":
        return """你现在是雅思口语考官。考试刚开始，请先进行简单的 ID Check，用友善的方式问候考生，然后问他们的全名，并请他们确认身份。只说考官该说的话，不要加任何额外说明或评分。用英文输出。"""

    if part == "part2_intro":
        return f"""你现在是雅思口语考官。Part 1已结束，现在进入Part 2。请告诉考生：
"Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. You have one minute to prepare. Here is your topic."
然后给出以下话题卡内容：{next_question}
只说考官该说的话，不要加任何额外说明。用英文输出。"""

    if part == "part3_intro":
        return f"""你现在是雅思口语考官。Part 2已结束，现在进入Part 3的深入讨论。
考生在Part 2讨论的话题是：{next_question}
请基于这个话题，提出第一个深入讨论的问题。只说考官该说的话，不要加任何额外说明或评分。用英文输出。"""

    return f"""你现在是雅思口语考官。正在进行 {part} 的考试。
之前的对话记录：
{transcript_context}

考生的最新回答是对话记录中的最后一条。请评估是否需要根据其回答进行追问，或者进入下一个问题。
{'下一个预设问题是：' + next_question if next_question else '请根据考生回答自行提出相关追问。'}
请仅输出你作为考官应该说出的英文句子，不要包含任何评分、反馈或多余的动作描写。"""


def get_scoring_prompt(full_transcript: str, target_score: float) -> str:
    """Generate the prompt for comprehensive exam scoring."""
    return f"""这是一场完整的雅思口语模拟考试对话记录：
{full_transcript}

该考生的预设目标分数是 {target_score} 分。
请根据雅思口语四项评分标准（FC - Fluency and Coherence, LR - Lexical Resource, GRA - Grammatical Range and Accuracy, PR - Pronunciation 基于文本逻辑预估）进行严格打分。

请按以下JSON格式输出，不要包含markdown代码块标记：
{{
  "overall_band": 6.5,
  "fc_score": 6.5,
  "lr_score": 6.5,
  "gra_score": 6.5,
  "pr_score": 6.5,
  "gap_analysis": "简要说明当前表现距离目标分数{target_score}分的差距分析",
  "part1_feedback": {{
    "score": 6.5,
    "feedback": "Part 1具体反馈",
    "highlights": ["亮点词汇或表达1", "亮点2"]
  }},
  "part2_feedback": {{
    "score": 6.5,
    "feedback": "Part 2具体反馈",
    "highlights": ["亮点词汇或表达1", "亮点2"]
  }},
  "part3_feedback": {{
    "score": 6.5,
    "feedback": "Part 3具体反馈",
    "highlights": ["亮点词汇或表达1", "亮点2"]
  }},
  "grammar_corrections": [
    {{"original": "原文", "corrected": "纠正后", "explanation": "说明"}}
  ],
  "better_expressions": [
    {{"original": "考生用的表达", "suggested": "更好的表达", "reason": "提升理由"}}
  ]
}}"""
