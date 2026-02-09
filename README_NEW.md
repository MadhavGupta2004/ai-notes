# 🧠 AI Notes Summarizer

AI Notes Summarizer is a full-stack web application that helps users create, manage, analyze, and summarize notes using AI.  
It also supports **PDF uploads**, **per-user data isolation**, **analytics**, **favorites**, and **Google authentication**.

---

## 🚀 Features

### 🔐 Authentication
- Google Sign-In using Firebase Auth
- Protected routes (Auth / Dashboard / Favorites / Analytics)
- Per-user data isolation using Firestore

### 📝 Notes Management
- Create, edit, delete notes
- Cloud storage with **Firestore** (syncs across all devices!)
- ❤️ Favorite notes feature
- Search functionality
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

### 🧠 Quiz Generation
- Auto-generate quizzes from note content
- Multiple choice format with answers
- Perfect for study sessions

### 📊 Analytics
- Total notes count
- Word statistics
- Notes written in last 7 days
- Longest note tracking
- **365-day activity heatmap** (like GitHub / LeetCode)

### 🎨 UI/UX
- Clean Bootstrap-based design
- Responsive layout (mobile, tablet, desktop)
- Real-time updates via Firestore
- Smooth animations and transitions
- Reusable top navigation bar

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- React Router
- Bootstrap 5
- pdfjs-dist

### Backend & Services
- Firebase Authentication (Google Sign-In)
- Firestore Database (cloud-hosted notes with real-time sync)
- Netlify Functions (serverless AI proxy)
- Groq LLM API (for AI features)

---

## ⚙️ Environment Variables

Create a `.env.local` file (do **not** commit this):

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

GROQ_API_KEY=your_groq_api_key
```

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Firebase project created
- Groq API key obtained

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Firebase & Firestore
📖 **Follow the detailed setup guide:** [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)

**Quick Summary:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project or use existing one
- Enable **Firestore Database** (test mode for development)
- Enable **Google Sign-In** authentication
- Copy your credentials to `.env.local`

### 4. Set Up Groq API
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Add to `.env.local`:
   ```
   GROQ_API_KEY=your_key
   ```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Pages & Routes

| Route | Description |
|-------|-------------|
| `/auth` | Google Sign-In page |
| `/dashboard` | Main notes management page |
| `/favorites` | View all favorite notes |
| `/analytics` | View statistics & activity heatmap |

---

## 🗂️ Project Structure

```
src/
├── pages/
│   ├── Dashboard.jsx      # Main note editor & manager
│   ├── Favorites.jsx      # Favorites view
│   ├── Analytics.jsx      # Statistics dashboard
│   └── Notfound.jsx       # 404 page
├── auth/
│   └── Login.jsx          # Google Sign-In
├── layout/
│   ├── ProtectedRoute.jsx # Auth guard
│   └── Navbar.jsx         # Navigation
├── components/
│   └── TopNavbar.jsx      # Top navigation bar
├── firebase.js            # Firebase config
├── firebaseDB.js          # Firestore operations
├── App.jsx                # Main app routing
└── main.jsx               # React entry point
```

---

## 🔄 Data Synchronization

- **Real-time updates**: Changes sync instantly across devices
- **Per-user isolation**: Only see your own notes
- **Automatic persistence**: All operations saved to Firestore
- **Cross-device access**: Log in anywhere and access all notes

---

## 💾 Firestore Database Structure

```
Database: Firestore
Collection: notes/
  └── {documentId}
      ├── userEmail: "user@example.com"
      ├── title: "My Note"
      ├── content: "Note content..."
      ├── isFavorite: false
      ├── summary: null or "AI summary"
      ├── quiz: null or [questions]
      ├── date: "2026-02-07"
      ├── createdAt: timestamp
      └── updatedAt: timestamp
```

---

## 🔐 Security

- **Authentication**: Firebase Google Sign-In
- **Data Privacy**: Firestore security rules ensure users only access their own notes
- **No sensitive data**: API keys stored securely in environment variables

---

## 📈 Deployments

### Deploy Frontend (Netlify)
```bash
npm run build
# Deploy the `dist` folder to Netlify
```

### Deploy Backend Functions (Netlify)
Backend functions in `netlify/functions/` are automatically deployed with Netlify.

---

## 🚀 Future Enhancements

- [ ] Note sharing & collaboration
- [ ] Dark mode
- [ ] Real-time collaboration
- [ ] Export notes as PDF/Markdown
- [ ] Voice note transcription
- [ ] Browser extension for web clipping
- [ ] Mobile app (React Native)

---

## 📝 License

MIT License - feel free to use and modify!

---

## ❓ Troubleshooting

**"Permission denied" error in Firestore?**
- Check Firestore security rules are published
- Verify user is authenticated

**Notes not showing?**
- Clear browser cache
- Check network tab for Firestore requests
- See [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for detailed help

**AI functions not working?**
- Verify `GROQ_API_KEY` is set correctly
- Check Netlify Functions are deployed
- Look for errors in browser console

---

Made with ❤️ using React, Firebase & Groq
