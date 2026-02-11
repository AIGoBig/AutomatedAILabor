from ..state import AgentState

def generate_node(state: AgentState):
    """
    Generates a report based on search results.
    """
    query = state['input']
    results = "\n\n".join(state['search_results'])
    
    # Placeholder for LLM call
    # In a real scenario, we would use ChatOpenAI or similar here.
    # For MVP verification without API keys, we simulate a response if no keys are present.
    
    print(f"--- GENERATING REPORT FOR: {query} ---")
    
    # Check for API Keys
    import os
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    llm = None
    if openai_key:
        print("Using OpenAI GPT-4o...")
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4o", temperature=0)
    elif anthropic_key:
        print("Using Anthropic Claude 3.5 Sonnet...")
        from langchain_anthropic import ChatAnthropic
        llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", temperature=0)
        
    if llm:
        try:
            from langchain_core.prompts import ChatPromptTemplate
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a professional research assistant. Write a comprehensive report based on the provided search results."),
                ("user", "Start your report with a clear title.\n\nQuery: {query}\n\nSearch Results:\n{results}")
            ])
            
            chain = prompt | llm
            response = chain.invoke({"query": query, "results": results})
            return {"report": response.content}
        except Exception as e:
            print(f"LLM Generation Failed: {e}")
            # Fallback to template if LLM fails
    
    # Fallback Template
    print("Using Fallback Template (No API Key or LLM Error)...")
    report = f"""
# Deep Research Report: {query}

## Executive Summary
Based on the analysis of {len(state['search_results'])} sources, we have found significant information regarding "{query}".

## Key Findings
- The search results indicate a strong interest in this topic.
- Key trends include: [Extracted from Search Results]

## Source Data
{results[:500]}... (truncated for brevity)
"""
    return {"report": report}
