# backend/query.py
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

from embedder import embed
from groq_client import generate_answer
from ingest import get_qdrant, TEXT_COLLECTION, IMAGE_COLLECTION

load_dotenv()

TEXT_TOP_K  = 5   # text chunks to retrieve
IMAGE_TOP_K = 3   # image descriptions to retrieve
MIN_SCORE   = 0.3 # discard results below this cosine similarity


# ── Retrieval ─────────────────────────────────────────────────

def retrieve_text(client: QdrantClient, query_vector: list[float]) -> list[dict]:
    """Search varag_text, return top-k hits above MIN_SCORE."""
    result = client.query_points(
    collection_name=TEXT_COLLECTION,
    query=query_vector,
    limit=TEXT_TOP_K,
    score_threshold=MIN_SCORE,
)
    
    return [
        {
            "content": h.payload["text"],
            "source":  h.payload["source"],
            "page":    h.payload["page"],
            "score":   round(h.score, 3),
            "type":    "text",
        }
        for h in result.points
    ]


def retrieve_images(client: QdrantClient, query_vector: list[float]) -> list[dict]:
    """Search varag_images, return top-k hits above MIN_SCORE."""
    result = client.query_points(
        collection_name=IMAGE_COLLECTION,
        query=query_vector,
        limit=IMAGE_TOP_K,
        score_threshold=MIN_SCORE,
    )
    return [
        {
            "content":    h.payload["description"],
            "image_path": h.payload["image_path"],
            "source":     h.payload["source"],
            "page":       h.payload["page"],
            "score":      round(h.score, 3),
            "type":       "image",
        }
        for h in result.points
    ]


# ── Prompt builder ────────────────────────────────────────────

def build_prompt(
    question: str,
    text_hits: list[dict],
    image_hits: list[dict],
) -> str:
    """
    Fuse text chunks and image descriptions into one
    structured prompt for the LLM.
    """

    # ── Text context block ──
    if text_hits:
        text_block = "\n\n".join(
            f"[Text · {h['source']} p.{h['page']} · score {h['score']}]\n{h['content']}"
            for h in text_hits
        )
    else:
        text_block = "No relevant text found."

    # ── Visual context block ──
    if image_hits:
        image_block = "\n\n".join(
            f"[Image · {h['source']} p.{h['page']} · score {h['score']}]\n{h['content']}"
            for h in image_hits
        )
    else:
        image_block = "No relevant images found."

    prompt = f"""You are an expert assistant answering questions from documents.
Use ONLY the context below to answer. Be specific and cite your sources (document name and page).
If the answer involves a chart or diagram, explicitly describe what the visual shows.
If you cannot answer from the context, say "I don't have enough information."

══ TEXT CONTEXT ══
{text_block}

══ VISUAL CONTEXT (from charts, diagrams, figures) ══
{image_block}

══ QUESTION ══
{question}

══ ANSWER ══"""

    return prompt


# ── Source formatter ──────────────────────────────────────────

def format_sources(text_hits: list[dict], image_hits: list[dict]) -> list[dict]:
    """
    Return a clean, deduplicated source list for the frontend
    to render as citations below the answer.
    """
    sources = []
    seen    = set()

    for h in text_hits + image_hits:
        key = (h["source"], h["page"], h["type"])
        if key not in seen:
            seen.add(key)
            entry = {
                "source": h["source"],
                "page":   h["page"],
                "type":   h["type"],
                "score":  h["score"],
            }
            if h["type"] == "image":
                entry["image_path"] = h["image_path"]
                # Send just the filename, not the full server path
                entry["image_name"] = os.path.basename(h["image_path"])
            sources.append(entry)

    # Sort by score descending
    sources.sort(key=lambda x: x["score"], reverse=True)
    return sources


# ── Main pipeline ─────────────────────────────────────────────

def query_varag(user_query: str) -> dict:
    """
    Full VARAG query pipeline:
    1. Embed the question
    2. Search text + image collections in parallel
    3. Build multimodal prompt
    4. Generate answer via Groq
    5. Return answer + formatted sources
    """
    print(f"\nQuery: {user_query}")

    client       = get_qdrant()
    query_vector = embed(user_query)

    # Retrieve from both collections
    text_hits  = retrieve_text(client, query_vector)
    image_hits = retrieve_images(client, query_vector)

    print(f"Text hits:  {len(text_hits)}")
    print(f"Image hits: {len(image_hits)}")

    # Edge case — nothing retrieved at all
    if not text_hits and not image_hits:
        return {
            "answer":  "I couldn't find any relevant content for your question. "
                       "Try uploading a document first.",
            "sources": [],
        }

    # Build prompt and generate
    prompt  = build_prompt(user_query, text_hits, image_hits)
    answer  = generate_answer(prompt)
    sources = format_sources(text_hits, image_hits)

    print(f"Answer generated ({len(answer)} chars)")

    return {
        "answer":  answer,
        "sources": sources,
    }