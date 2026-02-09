# 🔧 Troubleshooting Guide

## Issues Fixed ✅

### 1. **GROQ API Key Format Error**
**Problem**: `GROQ_API_KEY =...` (space before equals)  
**Solution**: Fixed in `.env` → `GROQ_API_KEY=...`  
**Action**: Your `.env` file is now corrected.

---

### 2. **Firestore Composite Index Error**
**Error**: "The query requires an index..."  
**Problem**: Using `where("userEmail") + orderBy("createdAt")` requires a Firestore composite index  
**Solution**: ✅ FIXED - Now sorting on frontend instead of Firestore  
**Action**: No manual index creation needed anymore!

---

### 3. **Firebase Auth Popup Blocked**
**Error**: `auth/popup-blocked`, `auth/cancelled-popup-request`  
**Common Causes**:
- Browser popup blocker enabled
- CORS issues
- Third-party cookie restrictions

**Solutions**:

#### Option A: If running on localhost:3000
- Whitelist `localhost:3000` in browser popup blocker
- Try a different browser (Firefox is usually more lenient)

#### Option B: If it's a Chrome security issue
```bash
# On Windows, run Chrome without security restrictions (dev only):
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --no-sandbox --disable-features=IsolateOrigins,site-per-process
```

#### Option C: Clear browser data
1. Go to Settings → Privacy → Clear Browsing Data
2. Select "Cookies and other site data"
3. Click Clear
4. Reload and try again

#### Option D: Check Firebase authorization domain
- Go to Firebase Console → Settings → Authorized Domains
- Make sure `localhost` is listed
- If not, add it

---

### 4. **Netlify Functions 500 Error**
**Error**: `Failed to load resource: the server responded with a status of 500`  
**Solutions**:

#### For Local Testing (`netlify dev`):
1. Stop the server (`Ctrl+C`)
2. Make sure `.env` file has `GROQ_API_KEY=...` (no space)
3. Restart: `netlify dev`
4. Functions should now work

#### Check if env vars are being read:
```bash
# In terminal, verify:
echo $env:GROQ_API_KEY  # Windows PowerShell
# Should print your API key
```

#### If still failing:
- Open browser DevTools (F12)
- Go to Network tab
- Make a request that uses AI (Summarize button)
- Click the failed request
- Check Response tab for error details
- This will tell you if it's an API key issue or Groq service issue

---

## 📋 Verification Checklist

Make sure these are all set correctly:

### `.env` file:
```
✅ VITE_FIREBASE_API_KEY=AIzaSyCzvoKGAeX...
✅ VITE_FIREBASE_AUTH_DOMAIN=ai-notes-75a33.firebaseapp.com
✅ VITE_FIREBASE_PROJECT_ID=ai-notes-75a33
✅ VITE_FIREBASE_STORAGE_BUCKET=ai-notes-75a33.firebasestorage.app
✅ VITE_FIREBASE_MESSAGING_SENDER_ID=255288722688
✅ VITE_FIREBASE_APP_ID=1:255288722688:web:...
✅ GROQ_API_KEY=gsk_...  (NO SPACE BEFORE =)
```

### Firebase Console:
```
✅ Firestore Database created
✅ Google Sign-In enabled in Authentication
✅ localhost in Authorized Domains (if testing locally)
```

### Netlify:
```
✅ netlify dev running (for local testing)
✅ Functions are being built (check terminal output)
```

---

## 🧪 Test Each Component

### Test 1: Can you sign in with Google?
1. Click "Sign in with Google" on login page
2. Should open a popup (if blocked, see popup solutions above)
3. If popup opens, select your Google account

### Test 2: Can you create a note?
1. Sign in successfully
2. Type a title and content
3. Click "Save Note"
4. Note should appear in sidebar (from Firestore)

### Test 3: Can AI summarize work?
1. Create a note with some content
2. Click "Summarize" button
3. Loading spinner should show
4. Should display summary in a few seconds

**If it fails**:
- Open DevTools (F12)
- Check Network tab for `summarize` request
- Click it and check the Response for error message

### Test 4: Can you favorite a note?
1. Create a note
2. Click heart icon
3. Should turn red immediately

### Test 5: Do favorites appear in Favorites page?
1. Click Favorites in navbar
2. Should see your favorited notes

---

## 🆘 Still Having Issues?

### Check browser console (F12)
Most errors appear here. Look for:
- Firebase errors
- Network errors
- JavaScript syntax errors

### Check server logs (if using `netlify dev`)
Terminal output often shows function errors

### Enable Groq API debug logging
Add to Dashboard.jsx summarizeWithAI function:
```javascript
const response = await fetch("/.netlify/functions/summarize", ...);
const data = await response.json();
console.log("Groq Response:", data);  // Add this line
```

### Verify Firestore security rules
If notes aren't saving:
1. Go to Firebase Console → Firestore → Rules
2. Check rules allow your logged-in user
3. Try this for testing (INSECURE - dev only):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: Dev only!
    }
  }
}
```

---

## 📞 Getting Help

If you're still stuck:

1. **Firebase errors**: Check [Firebase Console](https://console.firebase.google.com) → Real-time Database tab for any issues

2. **Groq API errors**: Check [Groq Console](https://console.groq.com) → API key validity

3. **Netlify errors**: Check [Netlify Dashboard](https://app.netlify.com) → Functions tab

4. **Check the code**:
   - Dashboard.jsx line 257 (summarizeWithAI error)
   - Login.jsx line 70 (handleGoogleLogin)
   - netlify/functions/summarize.js (API call)

---

## After Fixes

Your app should now:
- ✅ Sign in with Google (popup should work)
- ✅ Save notes to Firestore (no index error)
- ✅ Sync notes across devices (real-time)
- ✅ Summarize with AI (Groq API)
- ✅ Generate quizzes
- ✅ Favorite and view favorites
- ✅ View analytics

Try everything again and let me know if you hit any more issues!
