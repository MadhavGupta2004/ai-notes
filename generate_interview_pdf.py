#!/usr/bin/env python3
"""Generate AI Notes Summarizer interview preparation PDF."""

from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parent / "AI_Notes_Summarizer_Interview_Prep.pdf"


class InterviewPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=16)
        self.set_margins(14, 14, 14)

    def _write(self, h, text, **kwargs):
        """multi_cell that always returns to left margin (avoids zero-width next line)."""
        self.multi_cell(0, h, text, new_x="LMARGIN", new_y="NEXT", **kwargs)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 110)
        self.cell(120, 6, "AI Notes Summarizer - Interview Prep Notes", align="L")
        self.cell(62, 6, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(180, 180, 190)
        self.line(14, self.get_y(), 196, self.get_y())
        self.ln(4)
        self.set_text_color(30, 30, 40)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(120, 120, 130)
        self.cell(
            0,
            8,
            "Aligned to codebase (ai-notes) + resume. Verify Firestore rules before interview.",
            align="C",
        )

    def h1(self, text):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(35, 40, 90)
        self._write(9, text)
        self.ln(2)
        self.set_text_color(30, 30, 40)

    def h2(self, text):
        self.ln(3)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(50, 55, 120)
        self._write(7, text)
        self.ln(1)
        self.set_text_color(30, 30, 40)

    def h3(self, text):
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(40, 70, 110)
        self._write(6, text)
        self.ln(0.5)
        self.set_text_color(30, 30, 40)

    def body(self, text):
        self.set_font("Helvetica", "", 10)
        self._write(5.2, text)
        self.ln(1)

    def bold(self, text):
        self.set_font("Helvetica", "B", 10)
        self._write(5.2, text)
        self.set_font("Helvetica", "", 10)

    def bullet(self, text, indent=6):
        self.set_font("Helvetica", "", 10)
        self.set_x(self.l_margin + indent)
        self.multi_cell(
            self.epw - indent,
            5.0,
            f"- {text}",
            new_x="LMARGIN",
            new_y="NEXT",
        )

    def numbered(self, n, text, indent=6):
        self.set_font("Helvetica", "", 10)
        self.set_x(self.l_margin + indent)
        self.multi_cell(
            self.epw - indent,
            5.0,
            f"{n}. {text}",
            new_x="LMARGIN",
            new_y="NEXT",
        )

    def callout(self, title, text):
        self.set_font("Helvetica", "B", 9)
        self._write(5, title)
        self.set_font("Helvetica", "", 9)
        self._write(4.8, text)
        self.ln(2)

    def qa(self, q, a):
        self.set_font("Helvetica", "B", 10)
        self._write(5.2, q)
        self.set_font("Helvetica", "", 10)
        self._write(5.0, f"Answer: {a}")
        self.ln(2)

    def mono(self, text):
        self.set_font("Courier", "", 8.5)
        self.set_fill_color(248, 248, 250)
        self._write(4.4, text, fill=True)
        self.set_font("Helvetica", "", 10)
        self.ln(1)

    def table(self, headers, rows, col_widths=None):
        if col_widths is None:
            usable = 182
            col_widths = [usable / len(headers)] * len(headers)

        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(55, 60, 110)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 6.5, h, border=1, fill=True, align="C")
        self.ln()
        self.set_text_color(30, 30, 40)
        self.set_font("Helvetica", "", 7.5)
        fill = False
        for row in rows:
            # Estimate row height from wrapping
            line_heights = []
            for i, cell in enumerate(row):
                lines = self.multi_cell(col_widths[i], 4.2, str(cell), dry_run=True, output="LINES")
                line_heights.append(len(lines))
            row_h = max(line_heights) * 4.2 + 1
            if self.get_y() + row_h > self.page_break_trigger:
                self.add_page()
                self.set_font("Helvetica", "B", 8)
                self.set_fill_color(55, 60, 110)
                self.set_text_color(255, 255, 255)
                for i, h in enumerate(headers):
                    self.cell(col_widths[i], 6.5, h, border=1, fill=True, align="C")
                self.ln()
                self.set_text_color(30, 30, 40)
                self.set_font("Helvetica", "", 7.5)

            x0, y0 = self.get_x(), self.get_y()
            if fill:
                self.set_fill_color(242, 244, 248)
            else:
                self.set_fill_color(255, 255, 255)
            for i, cell in enumerate(row):
                self.set_xy(x0 + sum(col_widths[:i]), y0)
                self.multi_cell(col_widths[i], 4.2, str(cell), border=1, fill=True)
            self.set_xy(x0, y0 + row_h)
            fill = not fill
        self.ln(3)


def build():
    pdf = InterviewPDF()
    pdf.add_page()

    # ========== COVER ==========
    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(35, 40, 90)
    pdf.multi_cell(0, 10, "AI Notes Summarizer", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(70, 70, 90)
    pdf.multi_cell(0, 7, "Project Interview Preparation Notes", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(
        0,
        5,
        "Personal cheat sheet aligned to the actual ai-notes codebase and resume.",
        align="C",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(3)
    pdf.set_draw_color(100, 110, 170)
    pdf.line(50, pdf.get_y(), 160, pdf.get_y())
    pdf.ln(6)
    pdf.set_text_color(30, 30, 40)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Resume claims covered:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 9)
    for b in [
        "Notes CRUD + PDF uploads",
        "Groq LLM summaries and quizzes",
        "Firebase Authentication + Firestore user-specific storage",
        "Stack: React, Firebase, Groq LLM, Netlify Functions",
    ]:
        pdf.bullet(b, indent=4)
    pdf.ln(2)
    pdf.callout(
        "How to use this PDF",
        "Revise sections 1-3 and 20 before every interview. Use sections 5-11 for deep follow-ups. "
        "Anything marked CHECK BEFORE INTERVIEW must be verified in your Firebase/Netlify console.",
    )

    # ========== 1 ==========
    pdf.h2("1. Project Overview (1-minute revision)")
    pdf.bold("AI Notes Summarizer")
    pdf.body(
        "One-liner: A web app where users manage personal notes and PDFs, then generate AI summaries "
        "and quizzes using Groq LLM, with Firebase Auth and Firestore for user-specific storage."
    )
    pdf.bold("Problem it solves")
    pdf.bullet("Students/professionals have long notes and PDFs and need quick summaries + practice quizzes.")
    pdf.bold("Main features")
    for f in [
        "Email/password + Google login (Firebase Auth)",
        "Create / edit / delete notes (Firestore)",
        "Favorites, search, analytics heatmap",
        "PDF upload with client-side text extraction (pdfjs-dist)",
        "AI summary via Netlify Function -> Groq",
        "AI quiz (5 MCQs) via Netlify Function -> Groq",
    ]:
        pdf.bullet(f)
    pdf.bold("Tech stack and why")
    for line in [
        "React (Vite): Component UI, routing, SPA.",
        "Firebase Auth: Ready-made secure auth (email + Google).",
        "Firestore: Cloud NoSQL for notes CRUD + realtime listener.",
        "Groq LLM (llama-3.1-8b-instant): Fast, cheap summarization + quiz generation.",
        "Netlify Functions: Serverless proxy so GROQ_API_KEY stays off the frontend.",
        "pdfjs-dist: Extract text from PDFs in the browser before sending to AI.",
    ]:
        pdf.bullet(line)

    # ========== 2 ==========
    pdf.h2("2. 30-Second Interview Explanation")
    pdf.callout(
        "Speak this",
        "I built AI Notes Summarizer, a React web app that helps users manage study notes and PDFs. "
        "Users can create, edit, and delete notes, upload PDFs, and generate AI summaries and quizzes. "
        "I used Firebase Authentication so each user has a private account, and Firestore to store their notes. "
        "For AI, I call Groq's LLM through Netlify Functions so the API key stays on the server. "
        "The model returns bullet-point summaries and five multiple-choice quiz questions from the note content.",
    )

    # ========== 3 ==========
    pdf.h2("3. 1-2 Minute Detailed Explanation")
    pdf.body(
        "When an interviewer asks for more detail, walk the full flow:"
    )
    for i, step in enumerate(
        [
            "User opens the React SPA (Vite) and signs in with email/password or Google via Firebase Auth.",
            "App.jsx listens with onAuthStateChanged; ProtectedRoute blocks /dashboard, /favorites, /analytics, /settings if not logged in.",
            "On Dashboard, notes load in realtime via subscribeToUserNotes(userEmail) from Firestore collection notes.",
            "User creates/edits/deletes notes through createNote / updateNote / deleteNote in firebaseDB.js.",
            "For PDFs: browser uses pdfjs-dist to extract text (max 5MB, 30 pages), chunks text (~600 chars), summarizes each chunk, and stores truncated content + page summaries.",
            "For AI summarize/quiz: frontend POSTs to /.netlify/functions/summarize or generateQuiz. The function calls Groq chat completions with llama-3.1-8b-instant using GROQ_API_KEY from env.",
            "Summary/quiz is written back to the note document (updateSummary / updateQuiz) and shown in the UI.",
        ],
        start=1,
    ):
        pdf.numbered(i, step)

    # ========== 4 ==========
    pdf.add_page()
    pdf.h2("4. Complete Project Architecture")
    pdf.mono(
        "Browser (React SPA)\n"
        "  |-- Auth UI (Login.jsx) -----> Firebase Authentication\n"
        "  |-- ProtectedRoute / App.jsx -> auth state (onAuthStateChanged)\n"
        "  |-- Dashboard / Favorites / Analytics / Settings\n"
        "  |-- firebaseDB.js ----------> Firestore (collection: notes)\n"
        "  |-- pdfjs-dist -------------> extract PDF text in browser\n"
        "  |-- fetch('/.netlify/functions/...')\n"
        "         |\n"
        "         v\n"
        "Netlify Functions (summarize.js, generateQuiz.js)\n"
        "         |\n"
        "         v\n"
        "Groq API  (model: llama-3.1-8b-instant)\n"
        "         |\n"
        "         v\n"
        "Response -> frontend -> Firestore update -> UI"
    )
    pdf.bold("Responsibilities")
    for line in [
        "React: UI, forms, PDF upload, calling functions, displaying summary/quiz.",
        "Firebase Auth: identity (user.email used as ownership key).",
        "Firestore: persistent notes per userEmail; realtime onSnapshot.",
        "pdfjs-dist: turn PDF into text before LLM (LLM needs text, not binary PDF).",
        "Netlify Functions: hide API key; call Groq; return summary/quiz JSON.",
        "Groq: generate summary bullets or 5 MCQ JSON.",
    ]:
        pdf.bullet(line)
    pdf.callout(
        "Not in this project",
        "No custom Node/Express server. No MongoDB. No Hugging Face usage in code "
        "(VITE_HF_API_KEY may exist in .env but is unused). No Firebase Storage for PDF files - "
        "only extracted text (truncated) is stored.",
    )

    # ========== 5 ==========
    pdf.h2("5. End-to-End Flow")

    pdf.h3("A. User Registration / Login")
    for i, t in enumerate(
        [
            "Register: Login.jsx handleSignup -> createUserWithEmailAndPassword (password min 6). Name field is collected in UI but not saved via updateProfile.",
            "Login: handleLogin -> signInWithEmailAndPassword. Google: handleGoogleLogin -> signInWithPopup(googleProvider).",
            "Forgot password: sendPasswordResetEmail.",
            "Identity: auth.currentUser / user.email. App.jsx stores isLoggedIn + userEmail in localStorage for convenience; real source of truth is Firebase Auth.",
            "Auth state: onAuthStateChanged in App.jsx and ProtectedRoute.jsx.",
            "Logout: signOut(auth) from TopNavbar (also available in Settings).",
            "Routes: protected pages redirect to /auth if no user.",
        ],
        start=1,
    ):
        pdf.numbered(i, t)
    pdf.callout(
        "Note",
        "App.jsx can complete email magic-link sign-in (signInWithEmailLink), but Login never sends the link "
        "(sendSignInLinkToEmail missing). Do not claim magic-link signup unless you add it.",
    )

    pdf.h3("B. Creating a Note")
    for i, t in enumerate(
        [
            "User fills title + content on Dashboard (showNewNote form).",
            "handleAddNote validates non-empty title and content (early return if empty).",
            "createNote(userEmail, title, content) in firebaseDB.js -> addDoc to notes with userEmail, isFavorite:false, summary:null, quiz:null, date, createdAt, updatedAt.",
            "Association key: userEmail (string from auth user), not Firebase uid.",
            "UI updates via realtime subscribeToUserNotes onSnapshot - no manual list refresh needed.",
        ],
        start=1,
    ):
        pdf.numbered(i, t)

    pdf.h3("C. Editing a Note")
    pdf.body(
        "User enters edit mode (isEditing / editingId). handleAddNote calls updateNote(editingId, "
        "{ title, content, summary: null }). Summary is cleared so the user re-generates AI summary after edits. "
        "updatedAt is set in updateNote."
    )

    pdf.h3("D. Deleting a Note")
    pdf.body(
        "handleDeleteNote(id) -> deleteNote(id) -> deleteDoc. Clears selectedNote in UI. Errors show alert."
    )

    pdf.h3("E. PDF Upload")
    for i, t in enumerate(
        [
            "Hidden file input accept=application/pdf -> handlePDFUpload.",
            "Reject if > 5MB. extractTextFromPDF rejects if > 30 pages.",
            "pdfjs-dist getDocument + getTextContent per page; concatenates item.str.",
            "chunkText(text, 600) then summarizeWithAI per chunk -> pageSummaries [{page, text}].",
            "createNote(userEmail, file.name, text.slice(0,2000), pageSummaries). Full text is NOT fully stored - only first 2000 chars in content.",
            "Later quizzes use note.content (the truncated text).",
        ],
        start=1,
    ):
        pdf.numbered(i, t)

    pdf.h3("F. AI Summary Generation")
    pdf.mono(
        "note.content -> summarizeWithAI (Dashboard/Favorites)\n"
        "  POST /.netlify/functions/summarize  body: { text }\n"
        "  Netlify handler -> Groq chat/completions model llama-3.1-8b-instant\n"
        "  returns { summary } -> updateSummary(noteId, summary) -> Firestore -> UI"
    )
    pdf.bullet("API key: process.env.GROQ_API_KEY in Netlify Functions (not VITE_*).")
    pdf.bullet("Why not frontend: any VITE_ key is bundled into browser JS and can be stolen.")
    pdf.bullet("Model: llama-3.1-8b-instant; temperature 0.3; max_tokens 250.")

    pdf.h3("G. AI Quiz Generation")
    pdf.mono(
        "note.content -> generateQuizWithAI\n"
        "  POST /.netlify/functions/generateQuiz  body: { text }\n"
        "  System prompt: EXACTLY 5 MCQs, JSON only [{question, options[4], answer}]\n"
        "  Function JSON.parse(model content) -> returns array\n"
        "  Frontend checks Array.isArray -> updateQuiz(noteId, quiz)\n"
        "  UI lists questions with options and revealed answer (not interactive scoring)"
    )
    pdf.bullet("Model same; temperature 0.4; max_tokens 700.")
    pdf.bullet("If model returns markdown fences, JSON.parse fails -> alert Quiz generation failed.")

    # ========== 6 ==========
    pdf.add_page()
    pdf.h2("6. Important Files and Functions")
    pdf.table(
        ["File", "Function / Component", "Purpose", "Remember"],
        [
            ["src/App.jsx", "onAuthStateChanged + routes", "Auth gate + routing", "Source of login state"],
            ["src/auth/Login.jsx", "handleLogin/Signup/Google", "Auth UI", "Firebase Auth methods"],
            ["src/layout/ProtectedRoute.jsx", "ProtectedRoute", "Blocks unauthenticated pages", "Navigate to /auth"],
            ["src/firebase.js", "auth, db, googleProvider", "Firebase init + persistence", "VITE_FIREBASE_* env"],
            ["src/firebaseDB.js", "create/update/deleteNote, subscribe...", "All Firestore CRUD", "notes + userEmail"],
            ["src/pages/Dashboard.jsx", "CRUD + PDF + AI", "Main feature page", "Most interview depth"],
            ["src/pages/Favorites.jsx", "favorites + summarize", "Favorite notes view", "Filter isFavorite"],
            ["src/pages/Analytics.jsx", "stats + heatmap", "Usage analytics", "Uses subscribeToUserNotes"],
            ["src/pages/Settings.jsx", "password + logout", "Account settings", "Reauth for password"],
            ["src/components/TopNavbar.jsx", "nav + handleLogout", "Navigation", "signOut(auth)"],
            ["netlify/functions/summarize.js", "handler", "Groq summary proxy", "GROQ_API_KEY server-side"],
            ["netlify/functions/generateQuiz.js", "handler", "Groq quiz proxy", "JSON array response"],
            ["netlify.toml", "functions=...", "Functions folder + SPA redirect", "Need netlify dev locally"],
        ],
        col_widths=[42, 48, 46, 46],
    )

    # ========== 7 ==========
    pdf.h2("7. Firebase Authentication")
    pdf.body(
        "What: Managed auth service. How: Email/password + Google popup; App listens with onAuthStateChanged; "
        "ProtectedRoute wraps private pages. Why: Avoid building password hashing, sessions, OAuth yourself."
    )
    pdf.bullet("User ID used for data: primarily user.email stored as userEmail on notes.")
    pdf.bullet("Logout clears Firebase session and localStorage flags.")
    pdf.bold("Why Firebase Auth instead of building yourself?")
    pdf.body(
        "Building auth securely is hard (hashing, resets, Google OAuth, session theft). Firebase gives email and "
        "Google login quickly, integrates with Firestore rules, and fits a student/solo project timeline."
    )

    # ========== 8 ==========
    pdf.h2("8. Firestore Database Design")
    pdf.bold("Actual structure (flat collection - not nested users/{uid}/notes)")
    pdf.mono(
        "notes/{autoDocId}\n"
        "  userEmail: string   <-- ownership key\n"
        "  title: string\n"
        "  content: string     (PDF: first 2000 chars only)\n"
        "  isFavorite: boolean\n"
        "  summary: null | string | [{page, text}] for PDFs\n"
        "  quiz: null | [{question, options[], answer}]\n"
        "  date: YYYY-MM-DD\n"
        "  createdAt, updatedAt"
    )
    pdf.bullet("Read: query where userEmail == current user; sort createdAt client-side.")
    pdf.bullet("Realtime: onSnapshot in subscribeToUserNotes.")
    pdf.bold("Why Firestore?")
    pdf.body(
        "Realtime updates, easy Firebase Auth integration, no server to manage, document model fits notes well. "
        "For this app's scale and CRUD shape, Firestore is simpler than running MongoDB myself."
    )
    pdf.callout(
        "CHECK BEFORE INTERVIEW",
        "No firestore.rules file is in the repo. Recommended rules are documented in FIRESTORE_SETUP.md "
        "(email on token must match userEmail). Verify in Firebase Console that rules are published. "
        "If still in open test mode, say so honestly and mention tightening rules as a next step.",
    )

    # ========== 9 ==========
    pdf.h2("9. Groq LLM Integration")
    pdf.body(
        "What: Fast LLM API (OpenAI-compatible chat completions). How: Netlify Functions call "
        "https://api.groq.com/openai/v1/chat/completions with model llama-3.1-8b-instant. "
        "Why: Low latency and free/cheap tier good for demos; simple HTTP integration."
    )
    pdf.bullet("Summary prompt: 4-6 concise bullet points, simple language, no headings.")
    pdf.bullet("Quiz prompt: exactly 5 MCQs, JSON only, options A-D style array, answer field.")
    pdf.bullet("Frontend never sees GROQ_API_KEY; only receives summary string or quiz array.")
    pdf.bold("Interview phrasing")
    pdf.body(
        "I keep the Groq key in Netlify environment variables. React sends the note text to my serverless "
        "function, the function attaches the API key and calls Groq, then returns the result. That way the key "
        "is never shipped in the client bundle."
    )

    # ========== 10 ==========
    pdf.add_page()
    pdf.h2("10. Netlify Functions")
    pdf.body(
        "What: Serverless Node handlers deployed with the site. How: netlify/functions/summarize.js and "
        "generateQuiz.js export handler(event). React fetch POSTs JSON { text }. Why: Protect secrets and "
        "avoid running a full Express server."
    )
    pdf.bullet("summarize: validates key + text; returns { summary }.")
    pdf.bullet("generateQuiz: same; parses model JSON; returns quiz array.")
    pdf.bullet("Local: need netlify dev (plain vite alone won't serve /.netlify/functions).")
    pdf.bold("Why not call Groq directly from React?")
    pdf.body(
        "Because the API key would be visible in DevTools/network and anyone could steal quota. "
        "A Netlify Function acts as a thin backend that holds the secret."
    )
    pdf.callout(
        "Honest limitation",
        "Functions currently have no auth check - anyone who can hit the URL could burn Groq credits. "
        "Improvement: verify Firebase ID token in the function before calling Groq.",
    )

    # ========== 11 ==========
    pdf.h2("11. PDF Processing")
    pdf.mono(
        "Upload PDF -> pdfjs-dist extract text per page\n"
        "-> chunk (~600 chars) -> summarize each chunk via Groq\n"
        "-> save note: title=filename, content=first 2000 chars, summary=[{page,text}]"
    )
    pdf.bullet("Library: pdfjs-dist (browser). Limits: 5MB, 30 pages.")
    pdf.bullet("Why extract first: LLMs need text tokens; you cannot usefully POST a raw PDF binary to this chat API flow.")
    pdf.bullet("Scanned/image-only PDFs: text extraction returns little/empty - relevant limitation to mention if asked.")
    pdf.bullet("Quiz later uses truncated content (2000 chars), not the full PDF text.")

    # ========== 12 ==========
    pdf.h2("12. Important Technical Decisions - Why did I choose...?")
    pairs = [
        ("Why React?", "Component model and fast SPA UI for forms, lists, and AI results. Vite keeps DX simple."),
        ("Why Firebase?", "Auth + DB in one platform; quick to ship without managing servers."),
        ("Why Firestore?", "Realtime listeners and document CRUD map cleanly to notes; works with Firebase Auth."),
        ("Why Groq?", "Fast inference, OpenAI-compatible API, good for low-latency summaries/quizzes."),
        ("Why Netlify Functions?", "Deploy frontend + API together; keep GROQ_API_KEY server-side without Express."),
        ("Why not MongoDB?", "Would need my own backend/hosting; Firestore already covers CRUD + auth linkage."),
        ("Why not Node/Express?", "Overkill for two AI endpoints; serverless is enough and cheaper to operate."),
        ("Why use an LLM?", "Summaries and quiz generation are language tasks - LLMs do this better than regex/rules."),
        ("Why quizzes not only summaries?", "Active recall helps studying; MCQs are a natural second LLM use case."),
        ("Why userEmail not uid?", "Simple ownership field matching auth.email; works with documented rules. uid is more stable if email changes - possible improvement."),
    ]
    for q, a in pairs:
        pdf.bold(q)
        pdf.body(a)

    # ========== 13 ==========
    pdf.h2("13. Security Questions")
    pdf.qa(
        "Q: Where is the Groq API key stored?",
        "In Netlify environment variable GROQ_API_KEY, read only inside Netlify Functions via process.env.",
    )
    pdf.qa(
        "Q: Why shouldn't API keys be in React?",
        "Frontend code is public. Anyone can extract a VITE_ key from the bundle and abuse the API.",
    )
    pdf.qa(
        "Q: How do users only access their own notes?",
        "Queries filter where userEmail == logged-in email. Real enforcement should be Firestore security rules matching auth token email. CHECK deployed rules before interview.",
    )
    pdf.qa(
        "Q: How does Firebase Auth help?",
        "It proves who the user is. Combined with rules, only that identity can read/write matching notes.",
    )
    pdf.qa(
        "Q: What security rules does Firestore use?",
        "Recommended rules are in FIRESTORE_SETUP.md. No rules file is committed. Say: I document email-based ownership rules; I will confirm they are published in the console.",
    )
    pdf.qa(
        "Q: What would you improve security-wise?",
        "Confirm/publish Firestore rules; verify Firebase ID token inside Netlify Functions; rate-limit AI endpoints; stop relying on localStorage flags as security; prefer uid over email.",
    )

    # ========== 14 ==========
    pdf.add_page()
    pdf.h2("14. Performance and Scalability")
    pdf.bold("What my project currently does")
    for t in [
        "Client-side PDF extraction and sequential chunk summarization (can be slow for large PDFs).",
        "Realtime note listener per logged-in user.",
        "AI calls on demand (no caching of summaries beyond storing on the note document).",
        "Alerts on AI failure; no automatic retry/backoff.",
        "PDF capped at 5MB / 30 pages; content stored truncated to 2000 chars.",
    ]:
        pdf.bullet(t)
    pdf.bold("What I would improve in production")
    qa_prod = [
        ("10,000 users?", "Firestore scales for this pattern; watch read costs from onSnapshot. Add pagination, indexes, CDN for static assets."),
        ("Very large PDF?", "Stricter limits, server-side extraction, async job queue, store chunks, summarize in background."),
        ("Reduce Groq usage?", "Don't re-summarize if summary exists; shorter prompts; smaller model for drafts; cache by content hash."),
        ("Cache summaries?", "Already stored on note; add contentHash so edits invalidate; optional Redis/CDN for function responses."),
        ("Rate limits?", "Per-user quotas in functions using Auth UID; exponential backoff; queue."),
        ("Faster responses?", "Parallel chunk summaries carefully; stream tokens; pre-chunk on upload."),
        ("AI API fails?", "Show clear error, retry button, keep note usable without AI; circuit breaker."),
        ("Concurrent requests?", "Disable button while aiLoading (already); server-side concurrency limits."),
    ]
    for q, a in qa_prod:
        pdf.bold(q)
        pdf.body(a)

    # ========== 15 ==========
    pdf.h2("15. Error Handling")
    pdf.bold("What exists today")
    for t in [
        "Auth: Firebase error codes mapped to user-facing alerts in Login.jsx.",
        "Notes CRUD: try/catch + alert + console.error.",
        "PDF: size/page checks; alert on failure; progress UI while processing.",
        "Summarize/Quiz: alert on failure; summarize checks data.summary; quiz checks Array.isArray.",
        "Functions: 400 missing text; 500 missing key / exceptions; forward Groq errors.",
        "Loading: auth spinner; notes hydration; aiLoading disables buttons; PDF progress bar.",
        "Empty note create: early return if title/content missing.",
    ]:
        pdf.bullet(t)
    pdf.bold("Possible improvements")
    for t in [
        "Toasts instead of alert(); retry for transient network errors.",
        "Resync selectedNote after Firestore updates (possible stale UI after summarize/quiz).",
        "Validate quiz schema fields, not only Array.isArray.",
        "Strip markdown from model output before JSON.parse.",
        "Global error boundary in React.",
    ]:
        pdf.bullet(t)

    # ========== 16 ==========
    pdf.add_page()
    pdf.h2("16. Interview Questions & Answers (25+)")

    pdf.h3("Basic")
    basics = [
        ("1. What is your project?",
         "AI Notes Summarizer - a React web app for managing notes and PDFs with AI summaries and quizzes, using Firebase and Groq via Netlify Functions."),
        ("2. Why did you build it?",
         "I wanted a practical full-stack project that combines CRUD, auth, file handling, and real LLM integration for studying."),
        ("3. What technologies did you use?",
         "React with Vite, Firebase Auth, Firestore, pdfjs-dist, Groq LLM, and Netlify Functions. Bootstrap/Font Awesome for UI."),
        ("4. What is the role of React?",
         "It renders the UI, manages local state for forms and selected notes, handles routing, and calls Firebase and Netlify endpoints."),
        ("5. What is Firebase?",
         "A Google backend platform. I used Authentication for login and Firestore as the cloud database for notes."),
    ]
    for q, a in basics:
        pdf.qa(q, a)

    pdf.h3("Medium")
    medium = [
        ("6. How does authentication work?",
         "Users sign up or log in with email/password or Google. Firebase issues a session. App.jsx uses onAuthStateChanged, and ProtectedRoute blocks private pages."),
        ("7. How does Firestore store notes?",
         "Flat collection notes. Each document has userEmail, title, content, summary, quiz, favorites, and timestamps."),
        ("8. How does CRUD work?",
         "createNote addDoc, updateNote updateDoc, deleteNote deleteDoc, subscribeToUserNotes onSnapshot. Dashboard handlers call these."),
        ("9. How does PDF upload work?",
         "Browser extracts text with pdfjs-dist, chunks it, summarizes chunks with Groq, saves truncated text plus page summaries to Firestore."),
        ("10. How does the Groq API work?",
         "OpenAI-compatible chat completions. My function sends system + user messages and reads choices[0].message.content."),
        ("11. Why use Netlify Functions?",
         "To keep GROQ_API_KEY secret and host two small AI endpoints next to the static React app."),
        ("12. How do you protect the API key?",
         "It lives in Netlify env as GROQ_API_KEY. Only serverless code reads it. Not prefixed with VITE_."),
        ("13. How is the AI prompt created?",
         "Fixed system prompts in summarize.js and generateQuiz.js. User message is the note/PDF text."),
        ("14. How is the quiz generated?",
         "generateQuiz asks for exactly 5 MCQs as JSON. Function parses JSON and frontend stores the array on the note."),
        ("15. How does frontend talk to serverless?",
         "fetch POST to /.netlify/functions/summarize or generateQuiz with JSON body { text }."),
    ]
    for q, a in medium:
        pdf.qa(q, a)

    pdf.h3("Deep")
    deep = [
        ("16. Why Firestore instead of MongoDB?",
         "I didn't want to host a separate DB and API. Firestore gives realtime queries and ties into Firebase Auth with less ops work."),
        ("17. Why Groq instead of another LLM?",
         "Speed and simple HTTP API. llama-3.1-8b-instant is enough for short summaries and quizzes."),
        ("18. Why serverless functions?",
         "Only needed a secure proxy for Groq - not a full backend. Pay for usage and deploy with the site."),
        ("19. How would you scale this?",
         "Pagination, stricter PDF limits, background jobs for AI, function auth + quotas, confirm Firestore rules, maybe move extraction server-side."),
        ("20. What if Groq is unavailable?",
         "Today the UI alerts failure and the note remains. Production: retries, fallback model, queue, and cached previous summaries."),
        ("21. How reduce API costs?",
         "Skip regenerate if summary exists; truncate input; lower max_tokens; cache by hash; rate-limit users."),
        ("22. How handle huge PDFs?",
         "Current hard limits help. Next: async processing, store full text in Storage, summarize in jobs, warn on scanned PDFs."),
        ("23. How improve security?",
         "Publish Firestore rules, verify ID tokens in functions, rate limits, use uid, remove unused env keys."),
        ("24. What was the hardest part?",
         "Keeping AI key safe while still calling Groq from a SPA, plus PDF text extraction/chunking so summaries stay useful within token limits."),
        ("25. What would you improve with more time?",
         "Function auth, robust quiz JSON parsing, interactive quiz scoring, full PDF text storage strategy, and fix selectedNote stale UI after AI updates."),
        ("26. Why associate notes by email not uid?",
         "It matched my rules docs and was simple. uid is better long-term because emails can change."),
        ("27. Do you store the PDF file?",
         "No. I extract text client-side and store truncated content plus summaries. No Firebase Storage upload in this codebase."),
        ("28. Why chunk PDF text?",
         "Long PDFs exceed practical prompt size. Chunking summarizes sections then stores page-wise summaries."),
        ("29. How do Favorites work?",
         "toggleFavorite flips isFavorite. Favorites page filters notes where isFavorite is true."),
        ("30. Why edit clears summary?",
         "So outdated AI summaries don't stay after content changes; user regenerates intentionally."),
    ]
    for q, a in deep:
        pdf.qa(q, a)

    # ========== 17 ==========
    pdf.add_page()
    pdf.h2("17. Hardest Part of the Project")
    pdf.h3("1) Protecting the Groq API key in a SPA")
    pdf.bold("Problem -> What I did -> Why -> Result")
    pdf.body(
        "Problem: React alone would expose any client-side key. "
        "What I did: Added Netlify Functions summarize and generateQuiz that read GROQ_API_KEY from env. "
        "Why: Secrets must stay server-side. "
        "Result: Frontend only sends text and receives summary/quiz."
    )
    pdf.h3("2) PDF -> useful AI input under limits")
    pdf.body(
        "Problem: PDFs can be long; models have token limits; raw PDF isn't text. "
        "What I did: pdfjs-dist extraction, 5MB/30 page caps, chunkText(600), summarize chunks, store 2000-char content. "
        "Why: Keep requests reliable and costs bounded. "
        "Result: Upload flow works for typical study PDFs; tradeoff is truncated content for later quizzes."
    )
    pdf.h3("3) Structured quiz output from an LLM")
    pdf.body(
        "Problem: Models may return markdown or invalid JSON. "
        "What I did: Strict system prompt (JSON only, exact schema) + JSON.parse in the function + Array.isArray check in React. "
        "Why: UI needs predictable objects. "
        "Result: Works when model obeys; still fragile - good follow-up improvement topic."
    )

    # ========== 18 ==========
    pdf.h2("18. What I Personally Worked On")
    pdf.bold("Frontend")
    pdf.bullet("React pages: Login, Dashboard, Favorites, Analytics, Settings; routing and ProtectedRoute.")
    pdf.bullet("Notes UI, search, favorites toggle, analytics heatmap, loading/PDF progress states.")
    pdf.bold("Firebase")
    pdf.bullet("Auth flows (email/password, Google, reset, logout) and Firestore helpers in firebaseDB.js.")
    pdf.bold("AI integration")
    pdf.bullet("Netlify Functions calling Groq; summary + quiz prompts; saving results on notes.")
    pdf.bold("PDF functionality")
    pdf.bullet("Client-side extraction with pdfjs-dist, chunking, and creating notes from uploads.")
    pdf.bold("Backend / serverless")
    pdf.bullet("summarize.js and generateQuiz.js; netlify.toml functions config.")
    pdf.body("Do not claim a custom Express API or MongoDB - not in this codebase.")

    # ========== 19 ==========
    pdf.h2("19. Resume Alignment")
    pdf.h3('Bullet: "create, edit, delete, and manage personal notes along with PDF uploads"')
    pdf.body(
        "Explain: Dashboard createNote/updateNote/deleteNote; favorites and search as manage; "
        "PDF via handlePDFUpload + pdfjs-dist. Evidence: firebaseDB.js + Dashboard.jsx."
    )
    pdf.h3('Bullet: "Integrated Groq LLM to generate AI-powered summaries and quizzes"')
    pdf.body(
        "Explain: Not direct from browser - Netlify Functions call Groq llama-3.1-8b-instant. "
        "Summaries for notes and PDF chunks; quizzes are 5 MCQs stored on the note. "
        "Evidence: summarize.js, generateQuiz.js, Dashboard summarize/quiz handlers."
    )
    pdf.h3('Bullet: "Firebase Authentication and Firestore for user-specific note storage and CRUD"')
    pdf.body(
        "Explain: Login/signup/Google; onAuthStateChanged; notes filtered by userEmail; "
        "CRUD helpers and realtime subscription. Evidence: Login.jsx, App.jsx, firebaseDB.js."
    )
    pdf.h3("Extra features (say only if asked)")
    pdf.bullet("Analytics heatmap, favorites page, settings password change - implemented but not in resume bullets.")

    # ========== 20 ==========
    pdf.add_page()
    pdf.h2("20. Interview Explanation Cheat Sheet")
    pdf.bold("Project: AI Notes Summarizer")
    pdf.bold("Stack: React + Firebase Auth + Firestore + Groq LLM + Netlify Functions (+ pdfjs-dist)")
    pdf.bold("Core features")
    for t in ["Notes CRUD", "PDF upload/extract", "AI summary", "AI quiz", "Auth", "User-specific Firestore notes"]:
        pdf.bullet(t)
    pdf.bold("Architecture")
    pdf.mono("React -> Firebase Auth/Firestore\nReact -> Netlify Functions -> Groq\nReact (pdfjs) -> text -> AI -> Firestore")
    pdf.bold("Important files")
    pdf.body(
        "App.jsx, Login.jsx, ProtectedRoute.jsx, firebase.js, firebaseDB.js, Dashboard.jsx, "
        "netlify/functions/summarize.js, generateQuiz.js"
    )
    pdf.bold("Important functions")
    pdf.body(
        "createNote, updateNote, deleteNote, subscribeToUserNotes, updateSummary, updateQuiz, "
        "handlePDFUpload, extractTextFromPDF, summarizeWithAI, generateQuizWithAI, handler (both functions)"
    )
    pdf.bold("Key concepts")
    pdf.body(
        "onAuthStateChanged - userEmail ownership - onSnapshot realtime - serverless API key proxy - "
        "PDF text extraction before LLM - prompt engineering for JSON quizzes - client limits 5MB/30 pages"
    )
    pdf.callout(
        "30-second script",
        "I built a React notes app with Firebase Auth and Firestore so each user has private notes. "
        "Users can upload PDFs, extract text in the browser, and generate Groq AI summaries and quizzes "
        "through Netlify Functions so the API key stays server-side.",
    )
    pdf.bold("5 most likely questions")
    top5 = [
        ("What does your project do?",
         "Notes + PDF management with AI summary and quiz, secured by Firebase, AI via Groq/Netlify."),
        ("How is the API key safe?",
         "GROQ_API_KEY only in Netlify env; React never sees it."),
        ("How is data user-specific?",
         "Notes store userEmail; queries filter by logged-in email; rules should enforce match."),
        ("How do PDFs work?",
         "pdfjs extracts text -> chunk -> summarize -> save truncated content + summaries."),
        ("Why Netlify Functions?",
         "Thin secure backend for Groq without maintaining Express."),
    ]
    for q, a in top5:
        pdf.qa(q, a)

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(120, 50, 50)
    pdf.multi_cell(0, 5, "CHECK BEFORE INTERVIEW")
    pdf.set_text_color(30, 30, 40)
    pdf.set_font("Helvetica", "", 9)
    for t in [
        "Firestore security rules published in Firebase Console (not just FIRESTORE_SETUP.md).",
        "GROQ_API_KEY set on Netlify production site.",
        "Email/Password + Google providers enabled in Firebase Auth.",
        "Do not claim magic-link send, Hugging Face, MongoDB, Express, or PDF file Storage - not implemented.",
    ]:
        pdf.bullet(t)

    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
