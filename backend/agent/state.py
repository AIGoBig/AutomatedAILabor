from typing import TypedDict, List, Annotated
import operator

class AgentState(TypedDict):
    input: str
    search_results: Annotated[List[str], operator.add]
    report: str
    revision_number: int
    max_revisions: int
