# Backend (FastAPI)

## Setup
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints
- `GET /api/health` – checks Ollama connectivity and model name
- `POST /api/outline` – body: { topic, slides, style } → returns JSON outline
- `POST /api/generate-ppt` – body: { topic, slides, style } → returns `.pptx` file

Make sure Ollama is running locally with your chosen model:
```bash
ollama pull phi3:mini
ollama serve
```
