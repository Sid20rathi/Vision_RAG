# backend/ingest.py
import os
import uuid
import fitz  # PyMuPDF
from pathlib import Path
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from embedder import embed, embed_batch, VECTOR_SIZE
from groq_client import describe_image

load_dotenv()

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))

TEXT_COLLECTION  = "varag_text"
IMAGE_COLLECTION = "varag_images"

UPLOAD_DIR  = Path("uploads")
IMAGE_DIR   = Path("extracted_images")
UPLOAD_DIR.mkdir(exist_ok=True)
IMAGE_DIR.mkdir(exist_ok=True)

# Chunking config
CHUNK_SIZE    = 500   # characters per chunk
CHUNK_OVERLAP = 50    # overlap between consecutive chunks


# ── Qdrant helpers ────────────────────────────────────────────

def get_qdrant() -> QdrantClient:
    return QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def ensure_collections(client: QdrantClient):
    """Create both collections if they don't exist."""
    existing = [c.name for c in client.get_collections().collections]

    for name in [TEXT_COLLECTION, IMAGE_COLLECTION]:
        if name not in existing:
            client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(
                    size=VECTOR_SIZE,
                    distance=Distance.COSINE
                ),
            )
            print(f"✅ Created collection: {name}")


# ── Text helpers ──────────────────────────────────────────────

def chunk_text(text: str, source: str, page: int) -> list[dict]:
    """
    Split a page's text into overlapping chunks.
    Each chunk carries metadata so we can cite it later.
    """
    chunks = []
    start  = 0
    text   = text.strip()

    if not text:
        return chunks

    while start < len(text):
        end   = min(start + CHUNK_SIZE, len(text))
        chunk = text[start:end].strip()

        if chunk:
            chunks.append({
                "text":   chunk,
                "source": source,
                "page":   page,
                "type":   "text",
            })

        # Move forward by (CHUNK_SIZE - CHUNK_OVERLAP) to create overlap
        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


# ── Image helpers ─────────────────────────────────────────────

def extract_images_from_page(
    doc: fitz.Document,
    page: fitz.Page,
    page_num: int,
    source: str,
) -> list[dict]:
    """
    Extract all images from a page, save them to disk,
    call LLaVA for a description, return metadata list.
    """
    image_records = []

    for img_index, img_ref in enumerate(page.get_images(full=True)):
        xref = img_ref[0]

        try:
            base_image = doc.extract_image(xref)
        except Exception:
            continue

        # Skip tiny images — likely icons or decorations
        if base_image["width"] < 80 or base_image["height"] < 80:
            continue

        ext      = base_image["ext"]          # png, jpeg, etc.
        img_path = IMAGE_DIR / f"p{page_num}_i{img_index}.{ext}"

        with open(img_path, "wb") as f:
            f.write(base_image["image"])

        # Describe with LLaVA — this is the key VARAG step
        try:
            print(f"  🖼  Describing image: page {page_num}, image {img_index}")
            description = describe_image(str(img_path))
        except Exception as e:
            print(f"  ⚠️  LLaVA failed for {img_path}: {e}")
            description = f"Image on page {page_num} (description unavailable)"

        image_records.append({
            "description": description,
            "image_path":  str(img_path),
            "source":      source,
            "page":        page_num,
            "type":        "image",
        })

    return image_records


# ── Qdrant upsert helpers ─────────────────────────────────────

def upsert_text_chunks(client: QdrantClient, chunks: list[dict]):
    """Embed and upsert text chunks into varag_text."""
    if not chunks:
        return

    texts   = [c["text"] for c in chunks]
    vectors = embed_batch(texts)

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vectors[i],
            payload={
                "text":   chunks[i]["text"],
                "source": chunks[i]["source"],
                "page":   chunks[i]["page"],
                "type":   "text",
            },
        )
        for i in range(len(chunks))
    ]

    client.upsert(collection_name=TEXT_COLLECTION, points=points)
    print(f"  ✅ Upserted {len(points)} text chunks")


def upsert_image_records(client: QdrantClient, records: list[dict]):
    """Embed image descriptions and upsert into varag_images."""
    if not records:
        return

    points = []
    for rec in records:
        vector = embed(rec["description"])
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "description": rec["description"],
                    "image_path":  rec["image_path"],
                    "source":      rec["source"],
                    "page":        rec["page"],
                    "type":        "image",
                },
            )
        )

    client.upsert(collection_name=IMAGE_COLLECTION, points=points)
    print(f"  ✅ Upserted {len(points)} image records")


# ── Main pipeline ─────────────────────────────────────────────

def ingest_pdf(file_path: str, source_name: str) -> dict:
    """
    Full ingestion pipeline:
    1. Open PDF with PyMuPDF
    2. Per page: extract text → chunk → embed → upsert
    3. Per page: extract images → LLaVA describe → embed → upsert
    4. Return a summary dict
    """
    print(f"\n📄 Ingesting: {source_name}")
    client = get_qdrant()
    doc    = fitz.open(file_path)

    all_text_chunks  = []
    all_image_records = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        print(f"  📃 Page {page_num + 1}/{len(doc)}")

        # ── Text ──
        raw_text = page.get_text()
        chunks   = chunk_text(raw_text, source=source_name, page=page_num + 1)
        all_text_chunks.extend(chunks)

        # ── Images ──
        img_records = extract_images_from_page(
            doc, page, page_num=page_num + 1, source=source_name
        )
        all_image_records.extend(img_records)

    doc.close()

    # Batch upsert everything
    print("\n📦 Upserting to Qdrant...")
    upsert_text_chunks(client, all_text_chunks)
    upsert_image_records(client, all_image_records)

    summary = {
        "source":      source_name,
        "pages":       len(doc),
        "text_chunks": len(all_text_chunks),
        "images":      len(all_image_records),
        "status":      "success",
    }

    print(f"\n✅ Done: {summary}")
    return summary