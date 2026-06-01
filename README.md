# Light-weight Transcriber

![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)
![Claude](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet-blueviolet?logo=anthropic&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

A lightweight local tool that lets you paste a YouTube URL or any text and ask an LLM questions about it. No audio downloads — transcripts are fetched directly from YouTube's caption system.

## Features

- Paste a YouTube URL → fetch transcript → ask Claude anything about it
- Paste raw text → ask questions directly
- Fully local, no cloud hosting required
- Fast responses via Claude Sonnet

## Setup

**1. Clone and install dependencies**

```bash
git clone https://github.com/eugnmueller-87/Light-weight-Transcriber.git
cd Light-weight-Transcriber
uv sync
```

**2. Add your Anthropic API key**

```bash
cp .env.example .env
# Edit .env and paste your key from https://console.anthropic.com
```

**3. Start the server**

```bash
uv run uvicorn main:app --reload
```

API is now running at `http://localhost:8000`.

## API Endpoints

### `POST /ask/youtube`
Fetch a YouTube transcript and ask a question about it.

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "question": "What is this video about?"
}
```

### `POST /ask/text`
Ask a question about any pasted text.

```json
{
  "text": "Your text here...",
  "question": "Summarize this."
}
```

### `GET /health`
Returns `{"status": "ok"}` — used to verify the server is running.

## Requirements

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) package manager
- Anthropic API key
