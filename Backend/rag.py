from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings
)
from langchain_community.vectorstores import FAISS

load_dotenv()


def create_rag(pdf_path):
    documents = PyPDFLoader(pdf_path).load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )

    chunks = splitter.split_documents(documents)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-2-preview"
    )

    return FAISS.from_documents(chunks, embeddings)


def ask_question(db, question, history):
    docs = db.similarity_search(question, k=3)

    context = "\n\n".join(
        f"[Page {doc.metadata.get('page', 0) + 1}]\n{doc.page_content}"
        for doc in docs
    )

    sources = sorted(
        set(doc.metadata.get("page", 0) + 1 for doc in docs)
    )

    chat_history = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in history[-6:]
    )

    prompt = f"""
You are a helpful PDF assistant.

Answer ONLY using the PDF context below.
Use conversation history when useful.

If the answer is not available in the PDF, say:
"I couldn't find this information in the PDF."

Conversation:
{chat_history}

PDF Context:
{context}

Question:
{question}

Answer:
"""

    llm = ChatGoogleGenerativeAI(
        model="gemini-3.7-flash",
        temperature=0
    )

    response = llm.invoke(prompt)

    if isinstance(response.content, list):
        answer = response.content[0]["text"]
    else:
        answer = response.content

    return {
        "answer": answer,
        "sources": sources
    }