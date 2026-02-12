import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopNavbar from "../components/TopNavbar";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import {
  subscribeToUserNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleFavorite,
  updateSummary,
  updateQuiz,
} from "../firebaseDB";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Dashboard() {
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail");

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

  const [searchQuery, setSearchQuery] = useState("");

  // 📱 NEW: Mobile view state
  const [showMobileContent, setShowMobileContent] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (!isLoggedIn) {
    return null;
  }

  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to real-time note updates from Firestore
    const unsubscribe = subscribeToUserNotes(userEmail, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setIsHydrated(true);

      // Auto-select first note if none selected
      if (fetchedNotes.length > 0 && !selectedNote) {
        setSelectedNote(fetchedNotes[0]);
      }
    });

    return unsubscribe; // Cleanup subscription
  }, [userEmail]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      navigate("/auth");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Firebase signout failed (safe to ignore)");
    }

    localStorage.clear();
    // Dispatch custom event to trigger re-renders in same tab
    window.dispatchEvent(new Event("authStateChanged"));
    navigate("/auth", { replace: true });
  };

  const getFilteredNotes = () => {
    if (!searchQuery.trim()) {
      return notes;
    }

    const query = searchQuery.toLowerCase();
    const titleMatches = [];
    const contentMatches = [];

    notes.forEach((note) => {
      const titleMatch = note.title.toLowerCase().includes(query);
      const contentMatch = note.content.toLowerCase().includes(query);

      if (titleMatch) {
        titleMatches.push(note);
      } else if (contentMatch) {
        contentMatches.push(note);
      }
    });

    return [...titleMatches, ...contentMatches];
  };

  const handleSummarize = async (note) => {
    if (aiLoading) return;

    try {
      setAiLoading(true);

      const aiSummary = await summarizeWithAI(note.content);

      // Update note in Firestore
      await updateSummary(note.id, aiSummary);
    } catch (error) {
      console.error(error);
      alert("AI summarization failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;

    try {
      if (isEditing) {
        // Update existing note
        await updateNote(editingId, {
          title: newNoteTitle,
          content: newNoteContent,
          summary: null,
        });

        setIsEditing(false);
        setEditingId(null);
      } else {
        // Create new note
        await createNote(userEmail, newNoteTitle, newNoteContent);
      }

      setNewNoteTitle("");
      setNewNoteContent("");
      setShowNewNote(false);
      setShowMobileContent(false);
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      setSelectedNote(null);
      setShowMobileContent(false);
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  // ❤️ NEW: Toggle favorite status
  const handleToggleFavorite = async (id) => {
    try {
      const note = notes.find((n) => n.id === id);
      if (note) {
        await toggleFavorite(id, note.isFavorite);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite status. Please try again.");
    }
  };

  // 📱 NEW: Handle note selection on mobile
  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setShowMobileContent(true); // Show content on mobile
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

      const { text, totalPages } = await extractTextFromPDF(
        file,
        (current, total) => {
          setPdfTotal(total);
          setPdfProgress(current);
        }
      );

      const chunks = chunkText(text);
      let pageSummaries = [];

      for (let i = 0; i < chunks.length; i++) {
        const summary = await summarizeWithAI(chunks[i]);
        pageSummaries.push({
          page: i + 1,
          text: summary,
        });
      }

      // Create note in Firestore with PDF content
      await createNote(
        userEmail,
        file.name,
        text.slice(0, 2000),
        pageSummaries
      );

      setShowMobileContent(true);
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
      const pageText = content.items.map((item) => item.str).join(" ");
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

  const generateQuizWithAI = async (content) => {
    const response = await fetch("/.netlify/functions/generateQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
    });

    const quiz = await response.json();

    if (!Array.isArray(quiz)) {
      throw new Error("Quiz generation failed");
    }

    return quiz;
  };

  const handleGenerateQuiz = async (note) => {
    try {
      setAiLoading(true);

      const quiz = await generateQuizWithAI(note.content);

      // Update note in Firestore
      await updateQuiz(note.id, quiz);
    } catch (err) {
      alert("Quiz generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const filteredNotes = getFilteredNotes();

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

        .search-container {
          position: relative;
          margin-bottom: 15px;
        }

        .search-input {
          width: 100%;
          padding: 12px 40px 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 0.9rem;
          transition: all 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
          pointer-events: none;
        }

        .clear-search {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-search:hover {
          color: #667eea;
        }

        .search-results-info {
          font-size: 0.85rem;
          color: #888;
          margin-bottom: 10px;
          padding: 0 5px;
        }

        .no-results {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .no-results i {
          font-size: 48px;
          color: #ddd;
          margin-bottom: 15px;
        }

        .loading-skeleton-container {
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .loading-skeleton-container .spinner-border {
          width: 3rem;
          height: 3rem;
        }

        .skeleton-item {
          height: 80px;
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* 📱 NEW: Mobile overlay styles */
        .mobile-content-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1050;
          overflow-y: auto;
        }

        .mobile-content-overlay.show {
          display: block;
        }

        .mobile-back-button {
          position: sticky;
          top: 0;
          background: white;
          padding: 1rem;
          border-bottom: 1px solid #e0e0e0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mobile-back-button button {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #667eea;
          cursor: pointer;
        }

        .mobile-content-wrapper {
          padding: 1rem;
        }

        /* 📱 Responsive breakpoints */
        @media (max-width: 768px) {
          .col-md-8.col-lg-9 {
            display: none !important;
          }

          .content-area {
            padding: 20px;
            min-height: auto;
          }

          .btn-group-mobile {
            flex-wrap: wrap;
          }

          .btn-group-mobile button {
            flex: 1 1 45%;
            margin-bottom: 0.5rem;
          }
        }

        @media (min-width: 769px) {
          .mobile-content-overlay {
            display: none !important;
          }
        }
      `}</style>

      <div className="dashboard-container">
        <TopNavbar title="📝 Dashboard" />

        <div className="dashboard-content">
          <div className="row g-0 w-100 h-100">
            {/* Sidebar */}
            <div className="col-md-4 col-lg-3 h-100">
              <div className="sidebar p-3">
                <div className="sidebar-fixed-content">
                  <div className="stats-card">
                    <h6 className="mb-1">Total Notes</h6>
                    <h2 className="mb-0">{notes.length}</h2>
                  </div>

                  <button
                    onClick={() => {
                      setShowNewNote(true);
                      setShowMobileContent(true);
                    }}
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

                  <div className="search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery ? (
                      <button
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                        title="Clear search"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    ) : (
                      <i className="fas fa-search search-icon"></i>
                    )}
                  </div>

                  {searchQuery && (
                    <div className="search-results-info">
                      {filteredNotes.length} result
                      {filteredNotes.length !== 1 ? "s" : ""} found
                    </div>
                  )}

                  <h6 className="text-muted mb-3">
                    {searchQuery ? "Search Results" : "Recent Notes"}
                  </h6>
                </div>

                <div className="notes-scroll-container">
                  {!isHydrated ? (
                    <div className="loading-skeleton-container">
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading notes...</span>
                      </div>
                      <p className="text-muted">Fetching your notes from server...</p>
                      
                      {/* Skeleton loaders */}
                      <div className="skeleton-item"></div>
                      <div className="skeleton-item"></div>
                      <div className="skeleton-item"></div>
                    </div>
                  ) : filteredNotes.length > 0 ? (
                    filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`note-card ${
                          selectedNote?.id === note.id ? "active" : ""
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 
                            className="mb-0" 
                            style={{ cursor: "pointer", flex: 1 }}
                            onClick={() => handleNoteClick(note)}
                          >
                            {note.title}
                          </h6>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(note.id);
                            }}
                            className="btn btn-sm p-0 ms-2"
                            title={note.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <i className={`${note.isFavorite ? "fas" : "far"} fa-heart`} style={{ color: note.isFavorite ? "#e74c3c" : "#ccc" }}></i>
                          </button>
                        </div>
                        <p 
                          className="text-muted small mb-2"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleNoteClick(note)}
                        >
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
                    ))
                  ) : (
                    <div className="no-results">
                      <i className="fas fa-search"></i>
                      <p className="mb-0">No notes found</p>
                      <small className="text-muted">
                        Try a different search term
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content (Desktop) */}
            <div className="col-md-8 col-lg-9 h-100">
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
                        <label className="form-label fw-semibold">
                          Content
                        </label>
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
                            onClick={() => handleToggleFavorite(selectedNote.id)}
                            className="btn"
                            title={selectedNote.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <i className={`${selectedNote.isFavorite ? "fas" : "far"} fa-heart`} style={{ color: selectedNote.isFavorite ? "#e74c3c" : "#999", fontSize: "1.2rem" }}></i>
                          </button>

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
                            onClick={() => handleGenerateQuiz(selectedNote)}
                            className="btn btn-outline-success"
                            disabled={aiLoading}
                          >
                            🧠 Generate Quiz
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
                              <p
                                className="mb-0"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {item.text}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p
                            className="mb-0"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {selectedNote.summary}
                          </p>
                        )}
                      </div>

                      {Array.isArray(selectedNote.quiz) && (
                        <div className="alert alert-warning mt-4">
                          <h6 className="mb-3">
                            <i className="fas fa-question-circle me-2"></i>
                            AI Quiz
                          </h6>

                          {selectedNote.quiz.map((q, idx) => (
                            <div key={idx} className="mb-4">
                              <strong>
                                Q{idx + 1}. {q.question}
                              </strong>

                              <ul className="mt-2">
                                {q.options.map((opt, i) => (
                                  <li key={i}>{opt}</li>
                                ))}
                              </ul>

                              <small className="text-success">
                                ✔ Answer: {q.answer}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="content-area">
                      <div className="empty-state">
                        <i className="fas fa-file-alt"></i>
                        <h4>No Note Selected</h4>
                        <p>
                          Select a note from the sidebar or create a new one
                        </p>
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

        {/* 📱 NEW: Mobile Content Overlay */}
        <div className={`mobile-content-overlay ${showMobileContent ? 'show' : ''}`}>
          <div className="mobile-back-button">
            <button onClick={() => setShowMobileContent(false)}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h5 className="mb-0">
              {showNewNote ? "Create Note" : selectedNote?.title}
            </h5>
          </div>

          <div className="mobile-content-wrapper">
            {showNewNote ? (
              <div className="content-area">
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
                  <button onClick={handleAddNote} className="btn btn-gradient">
                    <i className="fas fa-save me-2"></i>
                    Save Note
                  </button>
                  <button
                    onClick={() => {
                      setShowNewNote(false);
                      setShowMobileContent(false);
                    }}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedNote ? (
              <div className="content-area">
                <div className="mb-3">
                  <p className="text-muted">
                    <i className="far fa-calendar me-2"></i>
                    {selectedNote.date}
                  </p>
                </div>

                <div className="d-flex gap-2 mb-4 btn-group-mobile flex-wrap">
                  <button
                    onClick={() => handleToggleFavorite(selectedNote.id)}
                    className="btn btn-outline-danger btn-sm"
                    title={selectedNote.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <i className={`${selectedNote.isFavorite ? "fas" : "far"} fa-heart me-1`}></i>
                    {selectedNote.isFavorite ? "Favorited" : "Add to Favorites"}
                  </button>

                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditingId(selectedNote.id);
                      setNewNoteTitle(selectedNote.title);
                      setNewNoteContent(selectedNote.content);
                      setShowNewNote(true);
                    }}
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="fas fa-edit me-1"></i>
                    Edit
                  </button>

                  <button
                    onClick={() => handleSummarize(selectedNote)}
                    className="btn btn-gradient btn-sm"
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic me-1"></i>
                        Summarize
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleGenerateQuiz(selectedNote)}
                    className="btn btn-outline-success btn-sm"
                    disabled={aiLoading}
                  >
                    🧠 Quiz
                  </button>

                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="btn btn-outline-danger btn-sm"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
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

                {Array.isArray(selectedNote.quiz) && (
                  <div className="alert alert-warning mt-4">
                    <h6 className="mb-3">
                      <i className="fas fa-question-circle me-2"></i>
                      AI Quiz
                    </h6>

                    {selectedNote.quiz.map((q, idx) => (
                      <div key={idx} className="mb-4">
                        <strong>
                          Q{idx + 1}. {q.question}
                        </strong>

                        <ul className="mt-2">
                          {q.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>

                        <small className="text-success">
                          ✔ Answer: {q.answer}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}