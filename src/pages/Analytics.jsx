import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopNavbar from "../components/TopNavbar";
import { subscribeToUserNotes } from "../firebaseDB";


export default function Analytics() {
  const navigate = useNavigate();
  const userEmail = auth.currentUser?.email || localStorage.getItem("userEmail");

  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!userEmail) return;

    // Subscribe to real-time note updates from Firestore
    const unsubscribe = subscribeToUserNotes(userEmail, (fetchedNotes) => {
      setNotes(fetchedNotes);
    });

    return unsubscribe; // Cleanup subscription
  }, [userEmail]);
  // 📊 CALCULATIONS
  const totalNotes = notes.length;

  const totalWords = notes.reduce(
    (sum, note) => sum + note.content.split(" ").length,
    0
  );

  const avgWords =
    totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;

  const longestNote =
    notes.length > 0
      ? notes.reduce((max, note) =>
          note.content.length > max.content.length ? note : max
        )
      : null;

  const notesLast7Days = notes.filter(note => {
    const diff =
      (new Date() - new Date(note.date)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;
  const notesPerDay = {};

notes.forEach(note => {
  if (!notesPerDay[note.date]) {
    notesPerDay[note.date] = 0;
  }
  notesPerDay[note.date]++;
});
const last30Days = Array.from({ length: 30 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toISOString().split("T")[0];
});
const getHeatColor = (count) => {
  if (count === 0) return "#ebedf0";
  if (count === 1) return "#c6e48b";
  if (count === 2) return "#7bc96f";
  if (count === 3) return "#239a3b";
  return "#196127";
};
const last365Days = Array.from({ length: 365 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (364 - i));
  return {
    date: d.toISOString().split("T")[0],
    day: d.getDay(), // 0 (Sun) → 6 (Sat)
  };
});
const weeks = [];
let week = Array(7).fill(null);

last365Days.forEach((item, index) => {
  week[item.day] = item;

  if (item.day === 6 || index === last365Days.length - 1) {
    weeks.push(week);
    week = Array(7).fill(null);
  }
});
const handleLogout = async () => {
  await signOut(auth);
  // Firebase auth state will be updated automatically via onAuthStateChanged in App.jsx
};



  return (
    <>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />

      <style>{`
        body {
          background: #f5f7fa;
        }
        .card-custom {
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .gradient {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
      `}</style>

      {/* Navbar */}
   <TopNavbar title="📊 Analytics" />
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card card-custom p-4 text-center">
              <h6>Total Notes</h6>
              <h2>{totalNotes}</h2>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card card-custom p-4 text-center">
              <h6>Total Words</h6>
              <h2>{totalWords}</h2>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card card-custom p-4 text-center">
              <h6>Avg Words / Note</h6>
              <h2>{avgWords}</h2>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card card-custom p-4">
              <h6>📅 Notes in Last 7 Days</h6>
              <h3>{notesLast7Days}</h3>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card card-custom p-4">
              <h6>🏆 Longest Note</h6>
              {longestNote ? (
                <>
                  <strong>{longestNote.title}</strong>
                  <p className="text-muted">
                    {longestNote.content.split(" ").length} words
                  </p>
                </>
              ) : (
                <p>No notes</p>
              )}
            </div>
          </div>
        </div>

  {
    //
  }
 <div className="card card-custom p-4 mt-4">
  <h6 className="mb-3">🔥 Writing Activity (Last 365 Days)</h6>

  <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
    {weeks.map((week, wIndex) => (
      <div
        key={wIndex}
        style={{ display: "flex", flexDirection: "column", gap: "6px" }}
      >
        {week.map((day, dIndex) => {
          if (!day) {
            return (
              <div
                key={dIndex}
                style={{ width: 14, height: 14 }}
              />
            );
          }

          const count = notesPerDay[day.date] || 0;

          return (
            <div
              key={day.date}
              title={`${day.date}: ${count} note(s)`}
              style={{
                width: "14px",
                height: "14px",
                backgroundColor: getHeatColor(count),
                borderRadius: "3px",
              }}
            />
          );
        })}
      </div>
    ))}
  </div>

  <small className="text-muted mt-2 d-block">
    Each column = week · Darker = more notes
  </small>
</div>




        
      </div>
    </>
  );
}
