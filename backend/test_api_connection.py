import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    base_url = os.getenv("OPENAI_BASE_URL", "http://127.0.0.1:8045/v1")
    api_key = os.getenv("OPENAI_API_KEY")
    
    models = [
        "gemini-3-flash", "gemini-3-pro-high", "gemini-3-pro-low",
        "gemini-3-pro-image", "gemini-2.5-flash", "gemini-2.5-flash-thinking",
        "claude-sonnet-4-5", "claude-sonnet-4-5-thinking", "claude-opus-4-5-thinking"
    ]

    print(f"DEBUG: Configured Base URL: {base_url}")
    print(f"DEBUG: Configured API Key prefix: {api_key[:10] if api_key else 'NONE'}")
    
    client = OpenAI(
        base_url=base_url,
        api_key=api_key
    )
    
    for model in models:
        print(f"\n--- Testing Model: {model} ---")
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Hello, hi!"}],
                timeout=30
            )
            print(f"SUCCESS [{model}]: {response.choices[0].message.content[:100]}...")
        except Exception as e:
            print(f"FAILED [{model}]: {type(e).__name__}: {str(e)}")
            if hasattr(e, 'response'):
                try:
                    print(f"Response Payload: {e.response.json()}")
                except:
                    print(f"Response Content: {e.response.text}")


if __name__ == "__main__":
    test_connection()
