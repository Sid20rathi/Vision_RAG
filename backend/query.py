
import os
from qdrant_client import QdrantClient
from embedder import embed
from groq_client import generate_answer
from ingest import get_qdrant, TEXT_COLLECTION, IMAGE_COLLECTION

TOP_K = 5  


def query_varag(user_query: str) -> dict:
    """
    Full query pipeline:
    1. Embed the query
    2. Search both Qdrant collections
    3. Build a combined prompt
    4. Generate answer with Groq
    Returns answer + sources.
    """
    # ── Phase 5 will fill this in ──
    return {
        "answer": "Query pipeline not implemented yet — coming in Phase 5.",
        "sources": [],
    }