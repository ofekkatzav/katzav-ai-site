# מדריך הגדרת סוכן AI ב-n8n

## 🎯 מה זה עושה?
ה-workflow הזה מחליף את הקריאה הישירה ל-Gemini מהאתר. כעת כל הלוגיקה רצה ב-n8n על השרת שלך.

---

## 📥 שלב 1: ייבוא ה-Workflow ל-n8n

### 1.1. כניסה ל-n8n
1. פתח דפדפן וגש ל: **https://n8n.srv942917.hstgr.cloud**
2. התחבר עם המשתמש והסיסמה שלך

### 1.2. ייבוא Workflow
1. לחץ על **"+"** (למעלה מימין) → **"Import from File"**
2. בחר את הקובץ: `n8n-workflow-diagnostic-agent.json`
   - (הקובץ נמצא גם בשרת ב-`/root/n8n-workflow-diagnostic-agent.json`)
3. לחץ **"Import"**

---

## 🔑 שלב 2: הוספת Gemini API Credentials

### 2.1. קבלת API Key מ-Google
1. גש ל: https://makersuite.google.com/app/apikey
2. לחץ **"Create API Key"**
3. העתק את המפתח

### 2.2. הוספה ל-n8n
1. ב-workflow שייבאת, לחץ על הצומת **"Gemini API - יצירת אפיון"**
2. תחת **"Credentials"** לחץ **"Create New Credential"**
3. מלא:
   - **Name:** `Google Gemini API`
   - **API Key:** הדבק את המפתח שקיבלת
4. לחץ **"Save"**

---

## ✅ שלב 3: הפעלת ה-Webhook

1. בתוך ה-workflow, לחץ על הצומת הראשון: **"Webhook - קבלת נתונים"**
2. תראה את כתובת ה-Webhook. היא תיראה כך:
   ```
   https://n8n.srv942917.hstgr.cloud/webhook/diagnostic-agent
   ```
3. **העתק את הכתובת הזו!** נצטרך אותה בשלב הבא.

4. לחץ על **"Save"** (למעלה מימין)
5. לחץ על הכפתור **"Active"** כדי להפעיל את ה-workflow

---

## 🌐 שלב 4: עדכון הקוד באתר

עכשיו צריך לעדכן את `src/app.jsx` להצביע על ה-webhook החדש במקום הקריאה הישירה ל-Gemini.

### מצא את הפונקציה `callGeminiAPI` (שורה ~94)

**החלף את כל הפונקציה הזו:**

```javascript
async function callGeminiAPI(formData) {
  const apiKey = ""; // As per instructions, leave empty.
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  // ... כל הקוד הישן ...
}
```

**ב-פונקציה החדשה הזו:**

```javascript
async function callGeminiAPI(formData) {
  // קריאה ל-n8n webhook במקום ישירות ל-Gemini
  const n8nWebhookUrl = 'https://n8n.srv942917.hstgr.cloud/webhook/diagnostic-agent';
  
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`שגיאת שרת: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'אירעה שגיאה בעיבוד הבקשה');
    }
    
    // החזרת התוצאה בפורמט שהאתר מצפה לו
    return data.result;
    
  } catch (error) {
    console.error("Error calling n8n webhook:", error);
    throw new Error(`קריאת ה-webhook נכשלה: ${error.message}`);
  }
}
```

### שמור ודחוף את השינויים:

```bash
git add src/app.jsx
git commit -m "Switch to n8n webhook for AI diagnostic agent"
git push
```

---

## 🧪 שלב 5: בדיקה

1. **חכה דקה-שתיים** שהפריסה האוטומטית תסתיים
2. גש לאתר: https://srv942917.hstgr.cloud
3. גלול ל"סוכן AI לאפיון חכם"
4. מלא את השאלות ושלח
5. אמור לקבל תשובה מה-AI! 🎉

---

## 📊 ניטור ואבחון

### איך לראות שה-workflow עובד:
1. ב-n8n, לחץ על **"Executions"** (בתפריט הצד)
2. תראה רשימה של כל הפעמים שה-workflow רץ
3. לחץ על execution כדי לראות את כל השלבים

### אם משהו לא עובד:
1. בדוק שה-workflow **Active** (ירוק)
2. בדוק ש-Gemini API credentials מוגדרים נכון
3. בדוק את ה-Executions אם יש שגיאות
4. בדוק ב-Console של הדפדפן אם יש שגיאות

---

## 🎁 בונוסים

### שמירת לידים אוטומטית
בתוך ה-workflow יש צומת **"שמירת ליד (אופציונלי)"** שכרגע מושבת.

אם רוצה לשמור לידים ב-CRM:
1. הפעל את הצומת (הסר את ה-disable)
2. חבר אותו ל-HubSpot / Pipedrive / Google Sheets / כל CRM
3. n8n יכול לשמור אוטומטית כל ליד שמגיע!

---

## ✅ סיכום היתרונות

### למה זה טוב יותר מקריאה ישירה?

1. **🔒 אבטחה** - ה-API Key של Gemini נמצא רק בשרת, לא בקוד הלקוח
2. **📊 ניטור** - אתה רואה את כל הקריאות ב-n8n
3. **🔄 גמישות** - קל לשנות את הלוגיקה בלי לעדכן את האתר
4. **💾 שמירת לידים** - קל להוסיף שמירה ב-CRM או שליחה למייל
5. **🎯 בקרה** - יכול להוסיף validations, rate limiting, analytics וכו'

---

**הצלחה! אם יש בעיות תודיע לי** 🚀

