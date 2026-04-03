export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Source = {
  source: string;
  page: number;
  type: "text" | "image";
  score: number;
  image_path?: string;
  image_name?: string;
};

export type QueryResponse = {
  answer: string;
  sources: Source[];
};

export type IngestResponse = {
  source: string;
  pages: number;
  text_chunks: number;
  images: number;
  status: string;
};

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch (error) {
    return false;
  }
}

export async function ingestPDF(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/ingest`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to ingest PDF");
  }

  return res.json();
}

export async function queryVARAG(question: string): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to query VARAG");
  }

  return res.json();
}
