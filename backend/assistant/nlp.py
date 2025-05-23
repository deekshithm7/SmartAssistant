import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI  # ✅ Updated import path

load_dotenv()

llm = ChatOpenAI(
    temperature=0.7,
    model_name="meta-llama/llama-4-scout-17b-16e-instruct",
    openai_api_base="https://api.groq.com/openai/v1",
    openai_api_key=os.getenv("GROQ_API_KEY")
)

def chat_response(prompt):
    response = llm.invoke(prompt)
    return response.content  # ✅ Extracts just the text to be JSON-safe
