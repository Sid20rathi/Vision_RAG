
from sentence_transformers import SentenceTransformer


_model = SentenceTransformer("all-MiniLM-L6-v2")

VECTOR_SIZE = 384  


def embed(text: str) -> list[float]:
    """Return a 384-dim embedding vector for any text string."""
    return _model.encode(text, normalize_embeddings=True).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed a list of strings — faster than calling embed() in a loop."""
    return _model.encode(
        texts, normalize_embeddings=True, show_progress_bar=True
    ).tolist()