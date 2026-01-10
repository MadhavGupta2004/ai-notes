import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
        summary: "Personal notes initialized",
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
  const handleLogout = () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userEmail");
  navigate("/auth");
};

  const handleSummarize = async (note) => {
  try {
    const aiSummary = await summarizeWithAI(note.content);

    const updatedNotes = notes.map(n =>
      n.id === note.id
        ? { ...n, summary: aiSummary }
        : n
    );

    setNotes(updatedNotes);
    setSelectedNote(
      updatedNotes.find(n => n.id === note.id)
    );
  } catch (error) {
    console.error(error);
    alert("AI summarization failed. Check API key or quota.");
  }
};



const handleAddNote = () => {
  if (!newNoteTitle || !newNoteContent) return;

  if (isEditing) {
    const updatedNotes = notes.map(note =>
      note.id === editingId
        ? {
  ...note,
  title: newNoteTitle,
  content: newNoteContent,
  summary: 'Click summarize to generate AI summary'
}

        : note
    );

    setNotes(updatedNotes);
    setSelectedNote(
      updatedNotes.find(note => note.id === editingId)
    );
    setIsEditing(false);
    setEditingId(null);
  } else {
    const newNote = {
      id: Date.now(), // 🔥 IMPORTANT (unique id)
      title: newNoteTitle,
      content: newNoteContent,
      date: new Date().toISOString().split('T')[0],
      summary: 'Click summarize to generate AI summary'
    };

    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
  }

  // 🔥 RESET FORM (THIS WAS MISSING)
  setNewNoteTitle('');
  setNewNoteContent('');
  setShowNewNote(false);
};


  const handleDeleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
    setSelectedNote(null);
  };
const summarizeWithAI = async (content) => {
  const response = await fetch("/.netlify/functions/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  const data = await response.json();

  if (data.error) throw new Error(data.error);

  return data[0].summary_text;
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
        }
        
        .dashboard-container {
          min-height: 100vh;
        }
        
        .navbar-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .sidebar {
          background: white;
          height: calc(100vh - 56px);
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
          overflow-y: auto;
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
        <nav className="navbar navbar-custom navbar-dark">
          <div className="container-fluid px-4">
            <span className="navbar-brand mb-0 h1">
              <i className="fas fa-robot me-2"></i>
              AI Notes Summarizer
            </span>
            <button onClick={handleLogout} className="btn btn-light btn-sm">
              <i className="fas fa-sign-out-alt me-2"></i>
              Logout
            </button>
          </div>
        </nav>

        <div className="row g-0">
          {/* Sidebar */}
          <div className="col-md-4 col-lg-3">
            <div className="sidebar p-3">
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

              <h6 className="text-muted mb-3">Recent Notes</h6>
              
              {notes.map(note => (
                <div 
                  key={note.id}
                  className={`note-card ${selectedNote?.id === note.id ? 'active' : ''}`}
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

          {/* Main Content */}
          <div className="col-md-8 col-lg-9">
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
                    <button onClick={handleAddNote} className="btn btn-gradient">
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
                      >
                        <i className="fas fa-magic me-2"></i>
                        Summarize
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
                    <p className="text-muted" style={{lineHeight: '1.8'}}>
                      {selectedNote.content}
                    </p>
                  </div>

                  <div className="alert alert-info">
                    <h6 className="mb-2">
                      <i className="fas fa-lightbulb me-2"></i>
                      AI Summary
                    </h6>
                    <p className="mb-0">{selectedNote.summary}</p>
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
    </>
  );
}
