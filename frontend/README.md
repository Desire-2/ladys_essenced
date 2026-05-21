# Lady's Essence — Frontend

React + Vite UI. All API calls go to the **Flask backend** (not an Express mock server).

## Run locally

**Prerequisites:** Node.js, Python backend running on port 5001

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file and set the backend URL:
   ```bash
   cp .env.example .env
   ```
   Default: `VITE_API_URL=http://localhost:5001`
3. Start the Flask API (from `backend/`):
   ```bash
   python run.py
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```
   App: http://localhost:3000  
   API: http://localhost:5001/api

Set `GEMINI_API_KEY` in **backend/.env** for Umwari (also accepts `GOOGLE_API_KEY` or `API_KEY`). Restart the Flask server after changing `.env`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
