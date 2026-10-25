from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv()
 
client = OpenAI(
    base_url=os.getenv("OPENAI_BASE_URL", "http://127.0.0.1:8045/v1"),
    api_key=os.getenv("OPENAI_API_KEY")
)
 
response = client.chat.completions.create(
    model="gemini-3-flash",
    messages=[{"role": "user", "content": "Hello"}]
)
 
print(response.choices[0].message.content)