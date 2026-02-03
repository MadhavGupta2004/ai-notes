# 🧠 AI Notes Summarizer

AI Notes Summarizer is a full-stack web application that helps users create, manage, analyze, and summarize notes using AI.  
It also supports **PDF uploads**, **per-user data isolation**, **analytics**, and **Google authentication**.

---

## 🚀 Features

### 🔐 Authentication
- Google Sign-In using Firebase Auth
- Protected routes (Auth / Dashboard / Analytics)
- Per-user data isolation using email-based storage

### 📝 Notes Management
- Create, edit, delete notes
- Auto-save notes to local storage (per user)
- Clean and modern dashboard UI

### 🤖 AI Summarization
- Text note summarization using Groq LLM
- Backend proxy via Netlify Functions (no CORS issues)
- Loading states & error handling

### 📄 PDF Summarization
- Upload PDFs (up to 30 pages / 5MB)
- Extract text using `pdfjs`
- Chunk large documents safely
- Page-wise AI summaries for better readability
- Progress bar + loading indicators

### 📊 Analytics
- Total notes count
- Word statistics
- Notes written in last 7 days
- Longest note
- **365-day heatmap** (like GitHub / LeetCode)

### 🎨 UI/UX
- Clean Bootstrap-based design
- Responsive layout
- Sidebar scroll isolation (large content won’t break layout)
- Reusable top navigation bar

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- React Router
- Bootstrap
- pdfjs-dist

### Backend
- Netlify Functions
- Groq LLM API

### Auth & Services
- Firebase Authentication (Google Sign-In)
- LocalStorage (per-user data)

---

## ⚙️ Environment Variables

Create a `.env` file (do **not** commit this):

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

GROQ_API_KEY=your_groq_api_key
