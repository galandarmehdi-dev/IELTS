# Project Structure

## Current architecture

This project is still a single-page HTML application with multiple feature areas toggled by JavaScript.

### Main files
- `index.html` — all major app sections live here
- `assets/js/app.js` — app boot, routing, home actions, and exam transitions
- `assets/js/ui.js` — shared screen visibility and UI helpers
- `assets/js/history.js` — history screen logic
- `assets/js/auth.js` — sign-in/auth flow

### Engines
- `assets/js/engines/listeningEngine.js`
- `assets/js/engines/readingEngine.js`
- `assets/js/engines/writingEngine.js`
- `assets/js/engines/speakingEngine.js`

### Test content
- `assets/js/tests/registry.js`
- `src/protectedTestContent.mjs`
- `src/objectiveAnswerKeys.mjs`

### Styling
- `assets/css/base.css` — shared global styling and auth styles
- `assets/css/home.css` — homepage, history, and admin styles
- `assets/css/listening.css` — listening UI
- `assets/css/reading.css` — reading UI
- `assets/css/writing.css` — writing UI
- `assets/css/speaking.css` — speaking UI

## Recommended next structural cleanup

1. Keep large HTML sections on cleaner rendering paths instead of reviving unused partial/template layers
2. Reduce direct manual class toggling outside `UI.showOnly()`
3. Keep all section view names centralized in `ui.js`
4. Split public homepage concerns from exam-app concerns more clearly
5. Eventually migrate from globals to module-based imports where practical
