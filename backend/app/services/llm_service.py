"""
LLM Service - handles communication with OpenAI-compatible APIs.
Supports user-provided API keys and model selection.
"""

import json
import re
from typing import Optional
from openai import AsyncOpenAI


async def call_llm(
    prompt: str,
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: Optional[str] = None,
    system_prompt: str = "You are a helpful IELTS speaking practice assistant.",
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    """
    Call an OpenAI-compatible LLM API.
    
    Args:
        prompt: The user message/prompt
        api_key: User's API key
        model: Model identifier (e.g., gpt-4o-mini)
        base_url: Optional custom API base URL for compatible providers
        system_prompt: System message for the conversation
        temperature: Randomness parameter
        max_tokens: Max response tokens
    
    Returns:
        The LLM's response text
    """
    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url

    client = AsyncOpenAI(**client_kwargs)

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"LLM API Error: {str(e)}")


async def call_llm_json(
    prompt: str,
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: Optional[str] = None,
    system_prompt: str = "You are a helpful IELTS speaking practice assistant. Always respond in valid JSON format.",
    temperature: float = 0.7,
) -> dict:
    """
    Call LLM and parse JSON response.
    Handles markdown code blocks in the response.
    """
    response_text = await call_llm(
        prompt=prompt,
        api_key=api_key,
        model=model,
        base_url=base_url,
        system_prompt=system_prompt,
        temperature=temperature,
    )

    # Strip markdown code block markers if present
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        # Remove ```json or ``` at start
        cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
        # Remove ``` at end
        cleaned = re.sub(r'\n?```\s*$', '', cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', cleaned)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        raise Exception(f"Failed to parse LLM response as JSON. Raw response: {response_text[:500]}")


async def call_llm_with_history(
    messages: list,
    api_key: str,
    model: str = "gpt-4o-mini",
    base_url: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 1000,
) -> str:
    """
    Call LLM with full conversation history.
    Used for multi-turn exam conversations.
    """
    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url

    client = AsyncOpenAI(**client_kwargs)

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"LLM API Error: {str(e)}")
