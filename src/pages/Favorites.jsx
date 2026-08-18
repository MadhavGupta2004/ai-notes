import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopNavbar from "../components/TopNavbar";
import {
  subscribeToUserNotes,
  toggleFavorite,
  updateSummary,
} from "../firebaseDB";
import { summarizeWithAI } from "../aiApi";

export default function Favorites() {
  const navigate = useNavigate();

  const userEmail = auth.currentUser?.email || localStorage.getItem("userEmail");

  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileContent, setShowMobileContent] = useState(false);

  const isLoggedIn = !!auth.currentUser;

  if (!isLoggedIn) {
    return null;
  }

  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to real-time note updates from Firestore
    const unsubscribe = subscribeToUserNotes(userEmail, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setIsHydrated(true);
    });

    return unsubscribe; // Cleanup subscription
  }, [userEmail]);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/auth");
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Firebase signout failed (safe to ignore)");
    }
    // Firebase auth state will be updated automatically via onAuthStateChanged in App.jsx
  };

  const getFavoriteNotes = () => {
    return notes.filter((note) => note.isFavorite);
  };

  const getFilteredFavorites = () => {
    const favoriteNotes = getFavoriteNotes();

    if (!searchQuery.trim()) {
      return favoriteNotes;
    }

    const query = searchQuery.toLowerCase();
    const titleMatches = [];
    const contentMatches = [];

    favoriteNotes.forEach((note) => {
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

  const handleToggleFavorite = async (id) => {
    try {
      const note = notes.find((n) => n.id === id);
      if (note) {
        await toggleFavorite(id, note.isFavorite);
        
        // If unfavoriting from favorites page, deselect it
        if (selectedNote?.id === id && !note.isFavorite) {
          setSelectedNote(null);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite status. Please try again.");
    }
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setShowMobileContent(true);
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

  const filteredFavorites = getFilteredFavorites();
  const totalFavorites = getFavoriteNotes().length;

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
          border-color: #e74c3c;
        }

        .note-card.active {
          border-color: #e74c3c;
          background: #ffe8e8;
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
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          margin-bottom: 20px;
        }

        .badge-custom {
          background: #e74c3c;
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
          border-color: #e74c3c;
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
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
          color: #e74c3c;
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
          color: #e74c3c;
          cursor: pointer;
        }

        .mobile-content-wrapper {
          padding: 1rem;
        }

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
        <TopNavbar title="❤️ Favorites" />

        <div className="dashboard-content">
          <div className="row g-0 w-100 h-100">
            {/* Sidebar */}
            <div className="col-md-4 col-lg-3 h-100">
              <div className="sidebar p-3">
                <div className="sidebar-fixed-content">
                  <div className="stats-card">
                    <h6 className="mb-1">Favorite Notes</h6>
                    <h2 className="mb-0">{totalFavorites}</h2>
                  </div>

                  <div className="search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search favorites..."
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
                      {filteredFavorites.length} result
                      {filteredFavorites.length !== 1 ? "s" : ""} found
                    </div>
                  )}

                  <h6 className="text-muted mb-3">
                    {searchQuery ? "Search Results" : "Your Favorites"}
                  </h6>
                </div>

                <div className="notes-scroll-container">
                  {filteredFavorites.length > 0 ? (
                    filteredFavorites.map((note) => (
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
                            title="Remove from favorites"
                          >
                            <i className="fas fa-heart" style={{ color: "#e74c3c" }}></i>
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
                          <span className="badge-custom">Favorite</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      <i className="fas fa-heart-broken"></i>
                      <p className="mb-0">No favorite notes</p>
                      <small className="text-muted">
                        Go to Dashboard and add favorites
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
                  {selectedNote ? (
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
                            title="Remove from favorites"
                          >
                            <i className="fas fa-heart" style={{ color: "#e74c3c", fontSize: "1.2rem" }}></i>
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
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="mb-3">Content</h5>
                        <p style={{ whiteSpace: "pre-wrap" }}>
                          {selectedNote.content}
                        </p>
                      </div>

                      {selectedNote.summary && (
                        <div className="alert alert-info">
                          <h6 className="mb-2">
                            <i className="fas fa-lightbulb me-2"></i>
                            AI Summary
                          </h6>
                          {Array.isArray(selectedNote.summary) ? (
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
                      )}
                    </div>
                  ) : (
                    <div className="content-area">
                      <div className="empty-state">
                        <i className="fas fa-heart"></i>
                        <h4>No Favorite Selected</h4>
                        <p>
                          Select a favorite note from the sidebar to view details
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Content Overlay */}
        <div
          className={`mobile-content-overlay ${showMobileContent ? "show" : ""}`}
        >
          <div className="mobile-back-button">
            <button onClick={() => setShowMobileContent(false)}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <h5 className="mb-0">{selectedNote?.title}</h5>
          </div>

          <div className="mobile-content-wrapper">
            {selectedNote ? (
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
                    title="Remove from favorites"
                  >
                    <i className="fas fa-heart me-1"></i>
                    Favorited
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
                </div>

                <div className="mb-4">
                  <h5 className="mb-3">Content</h5>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {selectedNote.content}
                  </p>
                </div>

                {selectedNote.summary && (
                  <div className="alert alert-info">
                    <h6 className="mb-2">
                      <i className="fas fa-lightbulb me-2"></i>
                      AI Summary
                    </h6>
                    {Array.isArray(selectedNote.summary) ? (
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
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {selectedNote.summary}
                      </p>
                    )}
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
