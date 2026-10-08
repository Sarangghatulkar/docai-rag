import { useState } from "react";
import "./App.css";

function App() {
  const [pdf, setPdf] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload PDF
  const uploadPDF = async (file) => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setPdf(file);
      setMessages([]);
    } catch (error) {
      alert("PDF upload failed");
    }

    setUploading(false);
  };

  // Ask question
  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    const text = question;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: text,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
          sources: [],
        },
      ]);
    }

    setLoading(false);
  };

  // New PDF
  const newPDF = () => {
    setPdf(null);
    setMessages([]);
    setQuestion("");
  };

  return (
    <div className="app">

      {/* Upload Screen */}

      {!pdf ? (
        <main className="upload-page">

          <div className="logo">📄</div>

          <h1>PDF Question Answering</h1>

          <p>
            Upload a PDF and chat with it using AI
          </p>

          <label className="upload-box">

            <div className="upload-icon">↑</div>

            <h3>
              {uploading
                ? "Processing PDF..."
                : "Upload your PDF"}
            </h3>

            <span>
              Click here to select a PDF file
            </span>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) =>
                uploadPDF(e.target.files[0])
              }
              disabled={uploading}
            />

          </label>

        </main>
      ) : (

        /* Chat Screen */

        <main className="chat-page">

          {/* Header */}

          <header className="header">

            <div className="brand">
              <div className="brand-icon">📄</div>

              <div>
                <h2>DocAI</h2>
                <span>PDF Assistant</span>
              </div>
            </div>

            <button
              className="new-pdf-btn"
              onClick={newPDF}
            >
              + New PDF
            </button>

          </header>


          {/* PDF Information */}

          <div className="pdf-info">

            <span className="pdf-icon">📄</span>

            <div>
              <strong>{pdf.name}</strong>
              <small>Ready to chat</small>
            </div>

          </div>


          {/* Messages */}

          <div className="messages">

            {messages.length === 0 && (

              <div className="welcome">

                <div className="welcome-icon">
                  💬
                </div>

                <h1>Ask your PDF</h1>

                <p>
                  Ask questions about your document
                  and get answers using AI.
                </p>

              </div>

            )}


            {messages.map((message, index) => (

              <div
                key={index}
                className={`message-row ${message.role}`}
              >

                <div className="avatar">
                  {message.role === "user"
                    ? "You"
                    : "AI"}
                </div>

                <div className="message-content">

                  <div className="message-text">
                    {message.content}
                  </div>


                  {/* Sources */}

                  {message.role === "assistant" &&
                    message.sources?.length > 0 && (

                    <div className="sources">

                      <span className="sources-title">
                        Sources
                      </span>

                      {message.sources.map((page) => (
                        <span
                          className="source"
                          key={page}
                        >
                          Page {page}
                        </span>
                      ))}

                    </div>

                  )}

                </div>

              </div>

            ))}


            {/* Loading */}

            {loading && (

              <div className="message-row assistant">

                <div className="avatar">
                  AI
                </div>

                <div className="message-content">

                  <div className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              </div>

            )}

          </div>


          {/* Input */}

          <div className="input-area">

            <div className="input-wrapper">

              <input
                type="text"
                value={question}
                placeholder="Ask anything about your PDF..."
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    askQuestion();
                  }
                }}
                disabled={loading}
              />

              <button
                onClick={askQuestion}
                disabled={
                  loading || !question.trim()
                }
              >
                ↑
              </button>

            </div>

            <small>
              AI answers are generated from your uploaded document.
            </small>

          </div>

        </main>
      )}

    </div>
  );
}

export default App;