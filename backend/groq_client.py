# backend/groq_client.py
import base64
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

VISION_MODEL    = "meta-llama/llama-4-scout-17b-16e-instruct"
GENERATION_MODEL = "llama-3.3-70b-versatile"


def describe_image(image_path: str) -> str:
    """
    Send an image to LLaVA on Groq.
    Returns a rich text description of the image.
    """
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    response = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64}"
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Describe this image in detail. "
                            "If it contains a chart, diagram, table, or figure, "
                            "explain what it shows, including all labels, axes, "
                            "values, and any trends visible."
                        ),
                    },
                ],
            }
        ],
        max_tokens=512,
    )
    return response.choices[0].message.content


def generate_answer(prompt: str) -> str:
    """
    Send a RAG prompt to llama-3.3-70b.
    Returns the final answer string.
    """
    response = client.chat.completions.create(
        model=GENERATION_MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant. Answer the question using ONLY "
                    "the provided context. If the context is insufficient, say so. "
                    "Always mention if your answer draws from a visual element like "
                    "a chart or diagram."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=1024,
        temperature=0.2,
    )
    return response.choices[0].message.content