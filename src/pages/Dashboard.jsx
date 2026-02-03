import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopNavbar from "../components/TopNavbar";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


export default function Dashboard() {
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail");
  const notesKey = `notes_${userEmail}`;

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);

  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [isHydrated, setIsHydrated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

const [pdfLoading, setPdfLoading] = useState(false);
const [pdfStage, setPdfStage] = useState(""); 
const [pdfProgress, setPdfProgress] = useState(0);
const [pdfTotal, setPdfTotal] = useState(0);


  useEffect(() => {
    if (!userEmail) return;

    const storedNotes = localStorage.getItem(notesKey);

    if (storedNotes && JSON.parse(storedNotes).length > 0) {
      setNotes(JSON.parse(storedNotes));
    } else {
      const defaultNotes = [
        {
          id: Date.now(),
          title: "Welcome Note",
          content: "This is your personal notes space.",
          date: new Date().toISOString().split("T")[0],
          summary: null,
        },
      ];

      setNotes(defaultNotes);
      localStorage.setItem(notesKey, JSON.stringify(defaultNotes));
    }

    setIsHydrated(true);
  }, [userEmail, notesKey]);

  useEffect(() => {
    if (isHydrated && userEmail) {
      localStorage.setItem(notesKey, JSON.stringify(notes));
    }
  }, [notes, isHydrated, userEmail, notesKey]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
    }
  }, [notes]);
  useEffect(() => {
  if (!localStorage.getItem("isLoggedIn")) {
    navigate("/auth");
  }
}, []);

const handleLogout = async () => {
  await signOut(auth);
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userId");

  navigate("/auth");
};


  const handleSummarize = async (note) => {
    if (aiLoading) return;

    try {
      setAiLoading(true);

      const aiSummary = await summarizeWithAI(note.content);

      const updatedNotes = notes.map((n) =>
        n.id === note.id ? { ...n, summary: aiSummary } : n
      );

      setNotes(updatedNotes);
      setSelectedNote(updatedNotes.find((n) => n.id === note.id));
    } catch (error) {
      console.error(error);
      alert("AI summarization failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddNote = () => {
    if (!newNoteTitle || !newNoteContent) return;

    if (isEditing) {
      const updatedNotes = notes.map((note) =>
        note.id === editingId
          ? {
              ...note,
              title: newNoteTitle,
              content: newNoteContent,
              summary: null,
            }
          : note
      );

      setNotes(updatedNotes);
      setSelectedNote(updatedNotes.find((note) => note.id === editingId));
      setIsEditing(false);
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now(),
        title: newNoteTitle,
        content: newNoteContent,
        date: new Date().toISOString().split("T")[0],
        summary: null,
      };

      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
    }

    setNewNoteTitle("");
    setNewNoteContent("");
    setShowNewNote(false);
  };

  const handleDeleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
    setSelectedNote(null);
  };

  const handlePDFUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("PDF too large. Max 5MB allowed.");
    return;
  }

  try {
    setPdfLoading(true);
    setPdfStage("Reading PDF");
    setPdfProgress(0);

const { text, totalPages } = await extractTextFromPDF(file, (current, total) => {
  setPdfTotal(total);
  setPdfProgress(current);
});


    const chunks = chunkText(text);

let pageSummaries = [];

for (let i = 0; i < chunks.length; i++) {
  const summary = await summarizeWithAI(chunks[i]);

  pageSummaries.push({
    page: i + 1,
    text: summary,
  });
}

const pdfNote = {
  id: Date.now(),
  title: file.name,
  content: text.slice(0, 2000),
  date: new Date().toISOString().split("T")[0],
  summary: pageSummaries,
};

setNotes(prev => [pdfNote, ...prev]);
setSelectedNote(pdfNote);


  } catch (err) {
    console.error(err);
    alert(err.message || "PDF processing failed");
  } finally {
    setPdfLoading(false);
    setPdfStage("");
  }
};


const summarizeWithAI = async (content) => {
  const response = await fetch("/.netlify/functions/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content }),
  });

  const data = await response.json();

  if (!data.summary) {
    throw new Error(data.error || "AI summarization failed");
  }

  return data.summary;
};





  const extractTextFromPDF = async (file, onPageRead) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

  if (pdf.numPages > 30) {
    throw new Error("PDF too large (max 30 pages)");
  }

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(" ");
    fullText += pageText + " ";

    onPageRead?.(i, pdf.numPages);
  }

  return {
    text: fullText,
    totalPages: pdf.numPages,
  };
};


const chunkText = (text, chunkSize = 600) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }

  return chunks;
};



  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        rel="stylesheet"
      />

      <style>{`
        body {
          background: #f5f7fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }
        
        .dashboard-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .navbar-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .dashboard-content {
          flex: 1;
          overflow: hidden;
          display: flex;
        }
        
        .sidebar {
          background: white;
          height: 100%;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
        }
        
        .sidebar-fixed-content {
          flex-shrink: 0;
        }
        
        .notes-scroll-container {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }
        
        .main-content-wrapper {
          flex: 1;
          overflow-y: auto;
          height: 100%;
        }
        
        .note-card {
          background: white;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 15px;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }
        
        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }
        
        .note-card.active {
          border-color: #667eea;
          background: #f8f9ff;
        }
        
        .content-area {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          min-height: 500px;
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          transition: all 0.3s;
        }
        
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          color: white;
        }
        
        .stats-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          margin-bottom: 20px;
        }
        
        .badge-custom {
          background: #667eea;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #888;
        }
        
        .empty-state i {
          font-size: 64px;
          color: #ddd;
          margin-bottom: 20px;
        }
      `}</style>
      <div className="dashboard-container">
        {/* Navbar */}
       <TopNavbar title="📝 Dashboard" />

        {/* 🔧 NEW: Dashboard content wrapper with fixed height */}
        <div className="dashboard-content">
          <div className="row g-0 w-100 h-100">
            {/* Sidebar */}
            <div className="col-md-4 col-lg-3 h-100">
              <div className="sidebar p-3">
                {/* 🔧 NEW: Fixed content section */}
                <div className="sidebar-fixed-content">
                  <div className="stats-card">
                    <h6 className="mb-1">Total Notes</h6>
                    <h2 className="mb-0">{notes.length}</h2>
                  </div>

                  <button
                    onClick={() => setShowNewNote(true)}
                    className="btn btn-gradient w-100 mb-3"
                  >
                    <i className="fas fa-plus me-2"></i>
                    New Note
                  </button>

                  <button
                    className="btn btn-outline-secondary w-100 mb-3"
                    onClick={() => document.getElementById("pdfInput").click()}
                  >
                    📄 Upload PDF
                  </button>

                  {pdfLoading && (
                    <div className="alert alert-info mt-3">
                      <div className="d-flex align-items-center mb-2">
                        <div className="spinner-border spinner-border-sm me-2"></div>
                        <strong>{pdfStage}...</strong>
                      </div>

                      <div className="progress">
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          style={{
                            width: `${(pdfProgress / pdfTotal) * 100}%`,
                          }}
                        >
                          {pdfProgress} / {pdfTotal}
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    id="pdfInput"
                    accept="application/pdf"
                    hidden
                    onChange={handlePDFUpload}
                  />

                  <h6 className="text-muted mb-3">Recent Notes</h6>
                </div>

                {/* 🔧 Scrollable notes list */}
                <div className="notes-scroll-container">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`note-card ${
                        selectedNote?.id === note.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedNote(note)}
                    >
                      <h6 className="mb-2">{note.title}</h6>
                      <p className="text-muted small mb-2">
                        {note.content.substring(0, 60)}...
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          <i className="far fa-calendar me-1"></i>
                          {note.date}
                        </small>
                        <span className="badge-custom">Note</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-md-8 col-lg-9 h-100">
              {/* 🔧 NEW: Scrollable wrapper for main content */}
              <div className="main-content-wrapper">
                <div className="p-4">
                  {showNewNote ? (
                    <div className="content-area">
                      <h4 className="mb-4">Create New Note</h4>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          placeholder="Enter note title"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-semibold">Content</label>
                        <textarea
                          className="form-control"
                          rows="10"
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Write your notes here..."
                        ></textarea>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          onClick={handleAddNote}
                          className="btn btn-gradient"
                        >
                          <i className="fas fa-save me-2"></i>
                          Save Note
                        </button>
                        <button
                          onClick={() => setShowNewNote(false)}
                          className="btn btn-outline-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : selectedNote ? (
                    <div className="content-area">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                          <h3 className="mb-2">{selectedNote.title}</h3>
                          <p className="text-muted">
                            <i className="far fa-calendar me-2"></i>
                            {selectedNote.date}
                          </p>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setEditingId(selectedNote.id);
                              setNewNoteTitle(selectedNote.title);
                              setNewNoteContent(selectedNote.content);
                              setShowNewNote(true);
                            }}
                            className="btn btn-outline-primary"
                          >
                            <i className="fas fa-edit"></i>
                          </button>

                          <button
                            onClick={() => handleSummarize(selectedNote)}
                            className="btn btn-gradient"
                            disabled={aiLoading}
                          >
                            {aiLoading ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                ></span>
                                Summarizing...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-magic me-2"></i>
                                Summarize
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteNote(selectedNote.id)}
                            className="btn btn-outline-danger"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="mb-3">Content</h5>
                        <p style={{ whiteSpace: "pre-wrap" }}>
                          {selectedNote.content}
                        </p>
                      </div>

                      <div className="alert alert-info">
                        <h6 className="mb-2">
                          <i className="fas fa-lightbulb me-2"></i>
                          AI Summary
                        </h6>
                        {selectedNote.summary === null ? (
                          <p className="mb-0 text-muted">
                            Click summarize to generate AI summary
                          </p>
                        ) : Array.isArray(selectedNote.summary) ? (
                          selectedNote.summary.map((item) => (
                            <div key={item.page} className="mb-3">
                              <strong>📄 Page {item.page}</strong>
                              <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                                {item.text}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                            {selectedNote.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="content-area">
                      <div className="empty-state">
                        <i className="fas fa-file-alt"></i>
                        <h4>No Note Selected</h4>
                        <p>Select a note from the sidebar or create a new one</p>
                        <button
                          onClick={() => setShowNewNote(true)}
                          className="btn btn-gradient mt-3"
                        >
                          <i className="fas fa-plus me-2"></i>
                          Create Your First Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}