# Fieldnotes — Personal Archive

A no-server, static collection for audio, lyrics, letters, and code. It builds with free tools, deploys to GitHub Pages, and can be opened from a USB drive without installing anything.

## Open the archive

- **USB / offline:** copy the project folder to the drive and double-click `index.html`. The generated `content/manifest-data.js` makes the archive work even when the browser blocks `fetch()` on `file://` pages. Keep the local `assets/css/styles.css` and manifest fallback alongside the HTML. Audio playback and Markdown reading do not need a connection.
- **Local server (optional):** use VS Code Live Server, or run `python -m http.server 8000` from this folder and visit `http://localhost:8000`.
- **Build tools:** Python 3 and Node.js are needed only to regenerate the manifest or compile CSS. They are not required to use the finished archive.

The page uses its locally compiled Tailwind stylesheet first and only tries the Tailwind CDN if that file cannot load and a network is available. Marked is an optional asynchronous enhancement; its plain-text fallback is stored in the app, so the interface and content remain usable without a network connection.

## Add your own files

Drop files into one of these folders:

| Folder | Content |
| --- | --- |
| `content/audio/` | MP3, WAV, OGG, M4A, or another format supported by the browser |
| `content/lyrics/` | Markdown lyrics |
| `content/letters/` | Markdown letters and notes |
| `content/code/` | Source files and snippets |

Use descriptive filenames; without metadata, a filename such as `summer-evening.md` becomes **Summer Evening**. Markdown supports optional YAML-style frontmatter:

```markdown
---
title: A Favorite Song
date: 2025-08-03
tags: [summer, piano]
description: A few words shown on the archive card.
---

Your Markdown content goes here.
```

For audio or other files that cannot contain frontmatter, add a JSON sidecar named either `track.mp3.json` or `track.json`:

```json
{
  "title": "A Favorite Song",
  "date": "2025-08-03",
  "tags": ["summer", "piano"],
  "description": "A few words shown on the archive card."
}
```

The date format is `YYYY-MM-DD`. If it is omitted, the generator uses the file's creation timestamp where available, falling back to its modification timestamp. Text in Markdown and source files is included in the search index. Avoid adding private information to a public GitHub Pages repository.

## Regenerate and build

### Local development setup (VS Code terminal)

Prerequisites: Python 3.11 or newer, Node.js 20 or newer, npm, and Git. From the project root, create and activate a project-local Python environment, install dependencies, and run checks/build:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
npm install
npm run lint
python scripts/generate_manifest.py
npm run build
```

If PowerShell prevents environment activation, allow scripts for the current terminal session and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

After adding, removing, or renaming files, `python scripts/generate_manifest.py` writes `content/manifest.json` and its `file://`-compatible companion, `content/manifest-data.js`. `npm run build` compiles the minified production Tailwind stylesheet and regenerates the manifest. Python packages are declared in `requirements.txt`; Node development/build packages are declared in `package.json` and locked in `package-lock.json`. The `.venv/` folder is local-only and ignored by Git.

To publish changes, commit and push them to the `main` branch (replace the example commit message as needed):

```powershell
git add .
git commit -m "Update archive"
git push origin main
```

If Git has not yet been initialized in this folder, run `git init`, add the GitHub remote with `git remote add origin https://github.com/OWNER/REPOSITORY.git`, and create/switch to the `main` branch before pushing. Husky installs its pre-commit hook when `npm install` runs in a Git repository; if needed, run `npm run prepare`.

## GitHub Pages deployment

The deployment workflow runs lint checks first, then creates an isolated Python 3.11 virtual environment and installs `requirements.txt`; it installs Node 20 dependencies with `npm ci`, generates the manifest, compiles Tailwind CSS, uploads the static site, and deploys it to GitHub Pages. Pip downloads and npm dependencies are cached by their respective setup actions; each job creates its own fresh virtual environment.

Configure GitHub Pages once in the repository:

1. Open the repository on GitHub.com and go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. There is no branch/folder selection for this workflow.
3. Ensure the repository's Actions settings permit GitHub Actions to run. The workflow declares the required `contents: read`, `pages: write`, and `id-token: write` permissions.

Push to `main` to deploy automatically, or open the repository's **Actions** tab, select **Deploy to GitHub Pages**, choose **Run workflow**, and confirm the `main` branch. In the Actions tab, open the latest run: the `lint` job must pass before `build-and-deploy` can run. A successful deployment job provides the published Pages URL; the same URL is shown under **Settings → Pages**.

The app has no backend, database, runtime build, or server dependency.
