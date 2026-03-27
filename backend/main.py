
import os
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from ingest import ingest_pdf, ensure_collections, get_qdrant, UPLOAD_DIR
from query import query_varag

app = FastAPI(title="Vision Rag API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Create Qdrant collections on first boot."""
    client = get_qdrant()
    ensure_collections(client)
    print("✅ Qdrant collections ready")


# ── Health check ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "VARAG"}


# ── Ingest endpoint ───────────────────────────────────────────
@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    """
    Accept a PDF upload, run the ingestion pipeline,
    return chunk counts.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Save to disk
    save_path = UPLOAD_DIR / f"{uuid.uuid4()}_{file.filename}"
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = ingest_pdf(str(save_path), source_name=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return result


# ── Query endpoint ────────────────────────────────────────────
class QueryRequest(BaseModel):
    question: str


@app.post("/query")
def query(body: QueryRequest):
    """
    Accept a question, run the VARAG pipeline,
    return the answer + retrieved sources.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        result = query_varag(body.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return result