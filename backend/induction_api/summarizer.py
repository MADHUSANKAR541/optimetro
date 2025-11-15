import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()  # Load GROQ_API_KEY

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def llm_summarize(reasons: list, train_id: str = None, decision: str = None) -> str:
    if not reasons:
        return "No reasoning provided."

    prompt = (
        f"Train ID: {train_id or 'Unknown'}\n"
        f"Decision: {decision or 'Unknown'}\n"
        f"Reasons:\n- " + "\n- ".join(reasons) + "\n\n"
        "Please summarize these reasons in a clear, concise, human-readable explanation, also assume yourself to be an explainable AI and add proper context to your summary."
    )

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-20b",
            stream=False,
        )
        summary = chat_completion.choices[0].message.content
        return summary
    except Exception as e:
        # Return mock summary if LLM fails
        return "Summary unavailable, fallback: " + ", ".join(reasons[:3]) + "..."
