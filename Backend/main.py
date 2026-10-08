from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile

from rag import create_rag, ask_question


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db = None
messages = []


class ChatRequest(BaseModel):
    question: str


@app.get("/")
def home():
    return {"message": "PDF RAG API is running"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global db, messages

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
    ) as temp:

        temp.write(await file.read())
        pdf_path = temp.name

    db = create_rag(pdf_path)
    messages = []

    return {
        "message": "PDF uploaded successfully"
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    global db, messages

    if db is None:
        return {
            "error": "Please upload a PDF first"
        }

    question = request.question

    result = ask_question(
        db,
        question,
        messages
    )

    messages.append({
        "role": "user",
        "content": question
    })

    messages.append({
        "role": "assistant",
        "content": result["answer"]
    })

    return result