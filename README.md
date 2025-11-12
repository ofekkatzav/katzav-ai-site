# Katzav AI Landing Page

דף נחיתה מקצועי עבור Katzav AI - פתרונות צ'אטבוטים לוואטסאפ ואוטומציה עסקית.

## 🚀 תכונות עיקריות

- **React SPA** - אפליקציית Single Page מבוססת React 18
- **עיצוב מודרני** - UI/UX מושקע עם TailwindCSS
- **אנימציות חלקות** - באמצעות Framer Motion
- **סוכן AI לאפיון** - ווידג'ט אינטראקטיבי שמתחבר ל-Gemini API
- **RTL מלא** - תמיכה בעברית מלאה עם כיוון ימין לשמאל
- **רספונסיבי מלא** - עובד מצוין בכל הגדלי מסך
- **אינטגרציה עם n8n** - מערכת Webhooks גמישה לאוטומציה

## 📋 דרישות מקדימות

- Node.js (גרסה 18 ומעלה)
- npm או yarn

## 🛠️ התקנה והפעלה

### 1. התקנת תלויות

```bash
npm install
```

### 2. הפעלת שרת פיתוח

```bash
npm run dev
```

האתר יהיה זמין בכתובת: `http://localhost:5173`

### 3. בניית הפרויקט לפרודקשן

```bash
npm run build
```

הקבצים הסטטיים ייווצרו בתיקייה `build/`

## 🔧 הגדרות חשובות

### חיבור Gemini API

כדי שסוכן ה-AI יעבוד, יש להוסיף את מפתח ה-API של Gemini:

1. פתחו את הקובץ `src/app.jsx`
2. מצאו את השורה:
   ```javascript
   const apiKey = ""; // As per instructions, leave empty.
   ```
3. החליפו עם מפתח ה-API שלכם:
   ```javascript
   const apiKey = "YOUR_GEMINI_API_KEY_HERE";
   ```

### חיבור Webhooks (n8n)

כדי לקבל לידים ואירועים בשרת האוטומציה שלכם:

1. פתחו את הקובץ `src/app.jsx`
2. מצאו את אובייקט `WEBHOOK_MAP`
3. החליפו את ה-URLs עם כתובות ה-Webhook של n8n שלכם:

```javascript
const WEBHOOK_MAP = {
  'default_lead': 'https://your-n8n-instance.com/webhook/new-lead',
  'form_submit_consultation': 'https://your-n8n-instance.com/webhook/consultation',
  'diagnostic_lead_captured': 'https://your-n8n-instance.com/webhook/diagnostic',
  'whatsapp_button_click': 'https://your-n8n-instance.com/webhook/whatsapp-click',
  'hero_cta_click': 'https://your-n8n-instance.com/webhook/hero-cta'
};
```

## 🌐 פריסה לפרודקשן

### אופציה 1: פריסה ידנית ל-VPS (Hostinger)

#### שלב 1: בניית הפרויקט
```bash
npm run build
```

#### שלב 2: התחברות לשרת
```bash
ssh root@YOUR_SERVER_IP
```

#### שלב 3: התקנת Nginx
```bash
sudo apt update
sudo apt install nginx
```

#### שלב 4: הגדרת Nginx
צרו קובץ קונפיגורציה:
```bash
sudo nano /etc/nginx/sites-available/katzav-ai
```

הדביקו את התוכן הבא:
```nginx
server {
    listen 80;
    server_name katzav-ai.co.il www.katzav-ai.co.il;
    
    root /var/www/katzav-ai;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

הפעילו את האתר:
```bash
sudo ln -s /etc/nginx/sites-available/katzav-ai /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### שלב 5: יצירת תיקייה והעלאת קבצים
בשרת:
```bash
sudo mkdir -p /var/www/katzav-ai
sudo chown -R $USER:$USER /var/www/katzav-ai
```

מהמחשב המקומי:
```bash
rsync -avz ./build/ root@YOUR_SERVER_IP:/var/www/katzav-ai/
```

### אופציה 2: פריסה אוטומטית עם GitHub Actions

הפרויקט כולל workflow מוכן לפריסה אוטומטית. בכל `git push` לענף `main`, הפרויקט ייבנה ויופרס אוטומטית.

#### הגדרה:

1. דחפו את הקוד ל-GitHub
2. הגדירו Secret בשם `VPS_SSH_KEY` עם המפתח הפרטי SSH שלכם
3. ערכו את הקובץ `.github/workflows/deploy.yml` והחליפו:
   - `YOUR_SERVER_IP` - עם ה-IP של השרת
   - `/var/www/katzav-ai` - עם הנתיב המתאים

מעכשיו כל `git push` יפעיל פריסה אוטומטית!

## 📁 מבנה הפרויקט

```
/Applications/landing page - katzav ai/
├── src/
│   ├── app.jsx          # רכיב ראשי עם כל הלוגיקה והרכיבים
│   ├── main.jsx         # Entry point של React
│   └── index.css        # קובץ CSS עיקרי (Tailwind)
├── index.html           # HTML ראשי
├── package.json         # תלויות וסקריפטים
├── vite.config.js       # הגדרות Vite
├── tailwind.config.js   # הגדרות Tailwind
├── postcss.config.js    # הגדרות PostCSS
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Actions workflow
```

## 🎨 רכיבים עיקריים

### Header
תפריט ניווט דביק עם לינקים לסקשנים ו-CTAs

### Hero
סקשן פתיחה עם כותרת ראשית וכפתורי פעולה

### DiagnosticWidget
סוכן AI אינטראקטיבי:
- 3 שאלות מובנות
- טופס לידים
- קריאה ל-Gemini API
- תצוגת תוצאות מובנית

### Services
4 כרטיסי שירותים עיקריים

### HowItWorks
4 שלבי תהליך עבודה

### IntegrationsStrip
רצועה מתגלגלת עם לוגואי אינטגרציות

### CaseStudies
דוגמאות פרויקטים

### ConsultationBooker
טופס ליצירת קשר מרכזי

### Testimonials
ציטוטים מלקוחות

### FAQ
אקורדיון שאלות נפוצות

### Contact
פרטי קשר (וואטסאפ, מייל, טלפון)

### FloatingWhatsApp
כפתור וואטסאפ צף

## 🔒 אבטחה ופרטיות

- כל ה-API Keys צריכים להיות מוגדרים רק בצד השרת
- Webhooks מאובטחים ב-HTTPS
- ואליציה מלאה של טפסים
- טיפול בשגיאות ברמת ייצור

## 📞 תמיכה

לשאלות ותמיכה:
- וואטסאפ: [052-8023630](https://wa.me/972528023630)
- אימייל: info@katzav.ai

## 📝 רישיון

© 2025 Katzav AI. כל הזכויות שמורות.

