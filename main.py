from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, VideoUnavailable
from urllib.parse import urlparse, parse_qs
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


def ask_claude(transcript: str, question: str) -> str:
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are a helpful assistant that answers questions about transcripts. "
            "Base your answers strictly on the provided transcript. "
            "If the answer is not in the transcript, say so clearly."
        ),
        messages=[
            {
                "role": "user",
                "content": f"Transcript:\n\n{transcript}\n\n---\n\nQuestion: {question}",
            }
        ],
    )
    return message.content[0].text


class YoutubeRequest(BaseModel):
    url: str
    question: str


class TextRequest(BaseModel):
    text: str
    question: str


class TranscriptResponse(BaseModel):
    transcript: str
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

    answer = ask_claude(transcript, req.question)
    return TranscriptResponse(transcript=transcript, answer=answer)


@app.post("/ask/text", response_model=TranscriptResponse)
def ask_text(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    answer = ask_claude(req.text, req.question)
    return TranscriptResponse(transcript=req.text, answer=answer)


@app.get("/health")
def health():
    return {"status": "ok"}
