from openai import OpenAI
import os

client = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="REDACTED_API_KEY"
)

try:
    response = client.chat.completions.create(
        model="gemini-3-flash",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("SUCCESS:")
    print(response.choices[0].message.content)
except Exception as e:
    print("FAILED:")
    print(str(e))
