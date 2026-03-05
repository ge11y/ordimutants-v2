# SHIP_STATIC_SITE Workflow

## Quick Command

```bash
ship_static_site <project-name>
```

## Prerequisites

1. **GitHub CLI authenticated:**
   ```bash
   gh auth login
   ```

2. **Project folder at:** `/projects/<project-name>/`

3. **Required files:**
   - `index.html` (required)
   - `style.css` (optional)
   - `script.js` (optional)
   - `assets/` (optional)
   - `README.md` (auto-generated if missing)

---

## What It Does

### A) Repo Setup
- Creates `/projects/<project-name>` if needed
- Initializes git if not already
- Commits all files

### B) GitHub Pages Deploy
- Creates GitHub repo via `gh repo create`
- Pushes to main branch
- Enables GitHub Pages (via gh or instructions)

### C) Output
```
PROJECT NAME: <name>
LOCAL PATH: /projects/<project-name>/
GITHUB REPO URL: https://github.com/<user>/<repo>/
PAGES LIVE URL: https://<user>.github.io/<repo>/
```

---

## Manual GitHub Pages Setup (if gh fails)

1. Go to: https://github.com/<username>/<repo>/settings/pages
2. **Build and deployment**
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /(root)
3. Click Save
4. Wait 1-2 min for deployment

---

## Safety Checks

✅ **Relative paths only** — `./assets/`, not `/assets/`  
✅ **Static only** — No build steps (React/Vite/Next = use Vercel)  
✅ **Single index.html** — Must exist at root

---

## Example Usage

```bash
# Ship team-portal
ship_static_site team-portal

# Ship any other site
ship_static_site my-landing-page
```
