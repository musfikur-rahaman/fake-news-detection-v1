from dotenv import load_dotenv
from langchain_groq import ChatGroq
import os
import streamlit as st

load_dotenv()

def get_groq_key():
    """Safely load Groq API key"""
    key = None
    try:
        key = st.secrets.get("GROQ_API_KEY")
    except Exception:
        pass
    return key or os.getenv("GROQ_API_KEY")


@st.cache_resource
def get_llm():
    """Initialize ChatGroq only when needed"""
    api_key = get_groq_key()
    if not api_key:
        st.error("🚨 GROQ_API_KEY not found! Add it to Streamlit Secrets or .env")
        return None
    return ChatGroq(
        api_key=api_key,
        model_name="meta-llama/llama-4-scout-17b-16e-instruct"
    )


def explain_fake_news(text):
    """
    Use Groq LLaMA to explain why a text is fake news.
    """
    llm = get_llm()
    if llm is None:
        return "API key missing — explanation unavailable."

    prompt = (
        f"The following news article has been classified as FAKE.\n"
        f"Explain in a few sentences why this might be fake news:\n\n{text}\n\nExplanation:"
    )
    try:
        response = llm.invoke(prompt)
        return response.content.strip() if hasattr(response, "content") else str(response)
    except Exception as e:
        return f"Error generating explanation: {e}"


if __name__ == "__main__":
    sample = "AI is taking over the world next year."
    print("Sample explanation:")
    print(explain_fake_news(sample))
