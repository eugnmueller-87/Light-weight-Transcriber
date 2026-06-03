# Start Transcriber

Open **two terminals** and run one command in each.

## Terminal 1 — Backend
```
uv run uvicorn main:app --reload
```

## Terminal 2 — Frontend
```
cd frontend
uv run python -m http.server 3000
```

## Then open in browser
```
http://localhost:3000
```

---

API running at `http://localhost:8000` · API docs at `http://localhost:8000/docs`
