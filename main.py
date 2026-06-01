from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, VideoUnavailable
from urllib.parse import urlparse, parse_qs
from typing import Literal
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Transcriber API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = (
    "You are a precise assistant that answers questions about a single source transcript. "
    "Base every answer strictly on the transcript text provided. Do not use outside knowledge. "
    "If the answer is not present, say so plainly in one sentence. Keep answers clear and concise, "
    "use short paragraphs, and quote the transcript briefly when it helps."
)


def extract_video_id(url: str) -> str:
    parsed = urlparse(url)
    if parsed.hostname in ("youtu.be",):
        return parsed.path.lstrip("/")
    if parsed.hostname in ("www.youtube.com", "youtube.com"):
        qs = parse_qs(parsed.query)
        if "v" in qs:
            return qs["v"][0]
    raise ValueError(f"Could not extract video ID from URL: {url}")


def fetch_transcript(video_id: str) -> str:
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    return " ".join(entry["text"] for entry in transcript)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class YoutubeRequest(BaseModel):
    url: str
    question: str


class TextRequest(BaseModel):
    text: str
    question: str


class ChatRequest(BaseModel):
    transcript: str
    messages: list[Message]


class TranscriptResponse(BaseModel):
    transcript: str
    answer: str


class ChatResponse(BaseModel):
    answer: str


@app.post("/ask/youtube", response_model=TranscriptResponse)
def ask_youtube(req: YoutubeRequest):
    try:
        video_id = extract_video_id(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        transcript = fetch_transcript(video_id)
    except NoTranscriptFound:
        raise HTTPException(status_code=404, detail="No transcript available for this video.")
    except VideoUnavailable:
        raise HTTPException(status_code=404, detail="Video is unavailable.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcript: {e}")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=f"{SYSTEM_PROMPT}\n\n=== TRANSCRIPT ===\n{transcript}\n=== END TRANSCRIPT ===",
        messages=[{"role": "user", "content": req.question}],
    )
    return TranscriptResponse(transcript=transcript, answer=message.content[0].text)


@app.post("/ask/text", response_model=TranscriptResponse)
def ask_text(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=f"{SYSTEM_PROMPT}\n\n=== TRANSCRIPT ===\n{req.text}\n=== END TRANSCRIPT ===",
        messages=[{"role": "user", "content": req.question}],
    )
    return TranscriptResponse(transcript=req.text, answer=message.content[0].text)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty.")

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=f"{SYSTEM_PROMPT}\n\n=== TRANSCRIPT ===\n{req.transcript}\n=== END TRANSCRIPT ===",
        messages=[{"role": m.role, "content": m.content} for m in req.messages],
    )
    return ChatResponse(answer=message.content[0].text)


@app.get("/health")
def health():
    return {"status": "ok"}
