# Chat → PPT (LLM-powered Presentation Builder)

Stack: **React + Tailwind** • **FastAPI** • **Ollama (Phi3-mini)** • **python-pptx** • **Pollinations AI**

---

##  Features

- AI slide generation (local Phi-3)
- AI images via Pollinations API
- Live preview before download
- PPT export (.pptx)
- Blue / Pink themes
- History & download counter
- FastAPI backend + React frontend

---

## Prerequisites

| Tool | Required |
|---|---|
| Node.js | 18+ |
| Python | 3.10+ |
| **Ollama** | Installed & running |
| Model | `phi3:mini` |

Install Ollama:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull phi3:mini
ollama serve
```

---

##  Setup Instructions

### **Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

### **Frontend**

```bash
cd frontend
npm install
npm run dev
```

Access UI: http://localhost:5173

---

## Architecture

```
React UI → FastAPI → Ollama (phi3-mini)
                    ↓
             Pollinations API (images)
                    ↓
                 .pptx file
```

---

##  Usage

| Step | Action |
|---|---|
1️⃣ | Enter topic & slide count  
2️⃣ | (Optional) Enable AI images  
3️⃣ | Click **Preview** to see slides  
4️⃣ | Click **Download** to get PPT  

---

## Troubleshooting

| Issue | Fix |
|---|---|
Ollama not responding | run `ollama serve` |
PPT not downloading | check backend logs |
Blank images | Pollinations rate limit — retry |

Kill port if stuck:

```bash
sudo lsof -t -i tcp:8000 | xargs kill -9
```

---

##  Demo Script (1 Minute)

> “This tool auto‑creates PPT slides using a local model (Phi‑3) for privacy and Pollinations for free AI images. User inputs a topic → model generates outline → images added → downloadable PPT. Fully local + open source.”

---

##  Completed Task Summary

- Set up Ollama & tested multiple models
- Implemented slide generator
- Added Pollinations AI image support
- Blue/Pink themes + modern UI
- Live preview + history tracking

---

## Credits & License

- Local LLM: Phi‑3 Mini
- UI: React + Tailwind
- Backend: FastAPI
- Images: Pollinations API

---

### End of Guide 
