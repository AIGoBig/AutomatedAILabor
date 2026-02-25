from __future__ import annotations
from typing import TypedDict, Annotated, Optional
import operator

class AgentState(TypedDict):
    input: str
    search_results: Annotated[list[str], operator.add]
    report: str
    revision_number: int
    max_revisions: int
    logs: list[str]
    model: str
    task_type: str # 'research' or 'code'
    code_blocks: list[dict[str, str]] # [{'filename': 'main.py', 'code': '...', 'language': 'python'}]
    file_structure: list[str]
    input_tokens: int
    output_tokens: int
    cost: float
    # Supervisor fields
    phase: str  # 'clarify', 'execute', 'review', 'done'
    task_spec: str  # Structured specification from supervisor
    review_feedback: str  # Supervisor's review comments
    review_approved: bool  # Whether supervisor approved the result
    messages: list[dict]  # Multi-turn chat messages [{"role": "...", "content": "..."}]
