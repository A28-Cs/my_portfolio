# Ahmed Ismail — Portfolio

Personal portfolio website for Ahmed Ismail, Junior AI Engineer. Built with Vite + Vanilla JS and backed by Firebase Firestore for dynamic content.

**Live demo:** [ahmedismail.dev](https://ahmedismail.dev) <!-- update with your actual URL -->

---

## Tech Stack

| Layer | Choice |
|---|---|
| Build tool | [Vite 5](https://vitejs.dev) |
| Language | Vanilla JS (ES modules) |
| Styling | Custom CSS design system (no framework) |
| Backend | Firebase Firestore (dynamic content) + Firebase Auth (admin) |
| Hosting | Firebase Hosting / Vercel |

---

## Pages

| Page | URL | Content |
|---|---|---|
| Home | `/` | Hero, featured projects teaser, services teaser |
| About | `/about.html` | Bio, skills grid (dynamic from Firestore) |
| Projects | `/projects.html` | Project cards (dynamic from Firestore) |
| Services | `/services.html` | Service cards with pricing (dynamic from Firestore) |
| Experience | `/experience.html` | Work timeline, education, certificates |
| Contact | `/contact.html` | Contact form (saves to Firestore) |
| Admin Login | `/admin/` | Hidden from public nav — admin only |
| Dashboard | `/dashboard.html` | Admin CMS for all Firestore collections |

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/A28-Cs/portfolio.git
cd portfolio
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder values with your real Firebase config (found in **Firebase Console → Project Settings → Your apps → Web app → SDK setup**):

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> `.env` is gitignored and never committed. See `.env.example` for the template.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Build for production

```bash
npm run build
```

Output goes to `dist/`.

---

## Project Structure

```
portfolio/
├── index.html              ← Home page
├── about.html              ← About + Skills
├── projects.html           ← Projects
├── services.html           ← Services + Pricing
├── experience.html         ← Experience + Education + Certificates
├── contact.html            ← Contact form
├── dashboard.html          ← Admin dashboard
├── dashboard.js            ← Dashboard logic (minified)
├── dashboard.css           ← Dashboard styles
├── admin/
│   └── index.html          ← Admin login page
├── admin-login.css         ← Admin login styles
├── src/
│   ├── styles/
│   │   ├── base.css        ← CSS variables, reset, typography
│   │   ├── layout.css      ← Navbar, footer, page structure
│   │   ├── components.css  ← Buttons, cards, badges, forms, timeline
│   │   ├── animations.css  ← Scroll reveals, keyframes, page transitions
│   │   └── home.css        ← Home page specific styles
│   └── scripts/
│       ├── firebase-config.js  ← Firebase init (reads from .env)
│       ├── translations.js     ← EN/AR i18n strings
│       ├── nav.js              ← Shared navbar, scroll reveal, typing effect
│       ├── home.js             ← Home page logic
│       ├── about.js            ← About page logic
│       ├── projects.js         ← Projects page logic
│       ├── services.js         ← Services page logic
│       ├── experience.js       ← Experience/Education/Certs logic
│       ├── contact.js          ← Contact form submission
│       └── admin/
│           └── login.js        ← Admin authentication
├── assets/
│   ├── favicon.png
│   └── ...
├── .env                    ← gitignored — your real Firebase keys
├── .env.example            ← committed — placeholder keys template
├── .gitignore
├── vite.config.js
└── package.json
```

---

## Firebase Setup

### Firestore Collections

The site reads from these Firestore collections for dynamic content:

| Collection | Used by |
|---|---|
| `projects` | Projects page, Home teaser |
| `skills` | About page |
| `services` | Services page, Home teaser |
| `experience` | Experience page (work timeline) |
| `education` | Experience page (education timeline) |
| `certificates` | Experience page |
| `messages` | Contact form writes here |

Each document should have an `active: true` field and an `order` number for display ordering.

### Admin Access

The admin dashboard (`/dashboard.html`) requires Firebase Authentication. To create an admin user:

1. Add the user in **Firebase Console → Authentication → Users**.
2. In Firestore, create a document at `admins/{uid}` with `{ role: "admin" }`.
3. Visit `/admin/` and sign in with those credentials.

---

## Security

- Firebase API keys are stored in `.env` (gitignored) and injected at build time via `VITE_FIREBASE_*` variables.
- Real access control is enforced by **Firebase Security Rules** on Firestore and Storage — the API key alone cannot grant unauthorized access.
- If you rotated the key after it was previously committed, generate a new one in **Firebase Console → Project Settings → Web API Key**.

---

## License

MIT — feel free to fork and adapt for your own portfolio.
