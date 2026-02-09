import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const NOTES_COLLECTION = "notes";

// 📝 GET ALL NOTES FOR USER (Real-time listener)
export const subscribeToUserNotes = (userEmail, callback) => {
  if (!userEmail) return () => {};

  // Note: Firestore composite index not required by removing orderBy from query
  // We'll sort on the frontend instead
  const q = query(
    collection(db, NOTES_COLLECTION),
    where("userEmail", "==", userEmail)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    // Sort by createdAt on frontend (descending)
    notes.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    
    callback(notes);
  });

  return unsubscribe;
};

// 📝 CREATE NEW NOTE
export const createNote = async (userEmail, title, content, summary = null) => {
  try {
    const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
      userEmail,
      title,
      content,
      isFavorite: false,
      summary,
      quiz: null,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error creating note:", error);
    throw error;
  }
};

// 📝 UPDATE NOTE
export const updateNote = async (noteId, updates) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating note:", error);
    throw error;
  }
};

// 📝 DELETE NOTE
export const deleteNote = async (noteId) => {
  try {
    await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

// ❤️ TOGGLE FAVORITE
export const toggleFavorite = async (noteId, currentFavoriteStatus) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      isFavorite: !currentFavoriteStatus,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error toggling favorite:", error);
    throw error;
  }
};

// 🤖 UPDATE SUMMARY
export const updateSummary = async (noteId, summary) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      summary,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating summary:", error);
    throw error;
  }
};

// 🧠 UPDATE QUIZ
export const updateQuiz = async (noteId, quiz) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      quiz,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating quiz:", error);
    throw error;
  }
};

// 📊 GET ANALYTICS DATA
export const getAnalyticsData = async (userEmail) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where("userEmail", "==", userEmail)
    );

    const querySnapshot = await getDocs(q);
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return notes;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};
