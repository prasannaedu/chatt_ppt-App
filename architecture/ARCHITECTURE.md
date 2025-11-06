# Architecture

```mermaid
flowchart TD
  U[User Browser] --> F[React + Tailwind Frontend]
  F -->|POST /api/outline, /api/generate-ppt| B[FastAPI Backend]
  B -->|POST /api/generate| O[Ollama (phi3:mini)]
  O --> B
  B -->|python-pptx| P[(.pptx file)]
  P --> F
```
