# Firestore Setup Guide

This project now uses **Firebase Firestore** for cloud data storage instead of localStorage. This enables data to sync across all devices and users.

## ✅ What You Need to Do

### 1. **Enable Firestore in Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (AI Notes Summarizer)
3. In the left sidebar, click **Firestore Database**
4. Click **Create database**
5. Choose configuration:
   - **Location**: Select closest to your region (e.g., `us-east1`)
   - **Security mode**: Start in **test mode** (for development)
6. Click **Create**

### 2. **Create Firestore Security Rules** (Optional but Recommended)

Once Firestore is created, go to **Rules** tab and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users to read/write their own notes
    match /notes/{document=**} {
      allow read, write: if request.auth != null &&
                          request.auth.token.email == resource.data.userEmail;
      allow create: if request.auth != null &&
                       request.auth.token.email == request.resource.data.userEmail;
    }
  }
}
```

Click **Publish** to apply these rules.

### 3. **No Code Changes Needed!** ✨

The code is already configured to use Firestore. Just:

1. Make sure your `.env.local` has Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Sign in with Google, and your notes will now sync to Firestore! 🎉

---

## 📊 Firestore Data Structure

Notes are stored in a `notes` collection with this structure:

```
notes/
  ├── {documentId}
  │   ├── userEmail: "user@example.com"
  │   ├── title: "My Note"
  │   ├── content: "Note content..."
  │   ├── isFavorite: false
  │   ├── summary: null or "AI summary"
  │   ├── quiz: null or [{question, options, answer}]
  │   ├── date: "2026-02-07"
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp
```

---

## 🔄 How Data Syncing Works

- **Real-time updates**: `subscribeToUserNotes()` listens for changes in real-time
- **Per-user isolation**: Only logged-in users can see their own notes
- **Automatic persistence**: All note changes are saved to Firestore immediately
- **Cross-device sync**: Notes appear on all devices/browsers where you're logged in

---

## 💾 Data Retention

- Notes are stored indefinitely in Firestore
- Deleting a note removes it from all devices
- Use Firestore Console to manually delete old data if needed

---

## 🆓 Free Tier Limits

Firestore free tier includes:
- **1 GB** stored data
- **50K** reads/day
- **20K** writes/day
- **1 GB** downloads/day

This is plenty for personal use and small teams!

---

## ⚠️ Transitioning from localStorage

If users already have notes in localStorage:
1. Notes won't automatically migrate (they're stored separately)
2. Users can manually recreate important notes in Cloud mode
3. Or we can add a migration script later if needed

---

## 🚀 Next Steps (Optional)

- Set up **Firestore backups** (go to Settings → Backups)
- Monitor **Firestore usage** (go to Usage tab)
- Enable **Firestore Labs** features as needed
- Scale security rules as your app grows

---

## ❓ Troubleshooting

**"Permission denied" error?**
- Check Firestore Security Rules are published
- Verify user is authenticated (check browser console)

**Notes not showing?**
- Reload the page
- Check browser network tab for Firestore requests
- Verify userEmail is being stored correctly

**Still using localStorage?**
- Clear browser cache
- Check that Firestore initialization succeeded
- Look for console errors

