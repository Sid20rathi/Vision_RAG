# VARAG: Vision-Augmented Retrieval and Generation

VARAG is a cutting-edge **Multimodal RAG** (Retrieval-Augmented Generation) system designed to interact with complex PDF documents. Unlike traditional RAG, VARAG understands both textual content and visual elements (charts, tables, diagrams) by leveraging Vision LLMs to describe visual context before indexing.

![VARAG Dashboard](https://raw.githubusercontent.com/Sid20rathi/Vision_RAG/main/frontend/public/screenshot.png) *(Placeholder for your actual screenshot)*

## 🚀 Key Features

- **Multimodal Ingestion**: Extracts text chunks and visual elements from PDFs.
- **Vision-Powered Analysis**: Uses LLaVA (on Groq) to describe images, making them searchable via vector embeddings.
- **Premium UI/UX**: High-end dark theme built with Next.js 14, Tailwind CSS, and shadcn/ui.
- **Interactive Retrieval**: View exact text sources and full-fidelity visual context in a dedicated side panel.
- **Real-time Status**: Live backend health monitoring.

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance API framework.
- **PyMuPDF**: Robust PDF parsing and image extraction.
- **Qdrant**: Vector database for efficient similarity search.
- **Sentence Transformers**: Local embeddings using `all-MiniLM-L6-v2`.
- **Groq SDK**: State-of-the-art inference for Llama-3 (Text) and LLaVA (Vision).

### Frontend
- **Next.js 14**: App Router and Server Components.
- **Tailwind CSS**: Modern utility-first styling.
- **shadcn/ui**: Premium UI components.
- **Framer Motion**: Smooth animations and transitions.

---

## 🚦 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Docker** (for running Qdrant)
- **Groq API Key** (Get one at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/Sid20rathi/Vision_RAG.git
cd Vision_RAG
```

### 2. Infrastructure (Qdrant)
Run the vector database using Docker Compose:
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

Run the backend:
```bash
uvicorn main:app --reload
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory (optional if using default):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 📖 How it Works

1. **Ingestion**: When you upload a PDF, PyMuPDF splits it into pages. Text is chunked, and images are extracted.
2. **Visual Analysis**: Each extracted image is sent to **LLaVA on Groq**. It generates a detailed description of chart axes, data points, or diagram logic.
3. **Indexing**: Both the text chunks and the image descriptions are converted into 384-dimensional vectors and stored in separate Qdrant collections.
4. **Querying**: Your question is embedded and searched across both collections. The top results (text + visual descriptions) are sent to **Llama-3-70B** to generate a comprehensive, multimodal answer.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
MIT License - see the [LICENSE](LICENSE) file for details.
