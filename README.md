# LanguageBarrieSys

Functional Modules:

1. Real-Time Voice Translator
   - Speech-to-text (STT) from Sinhala or Tamil using **OpenAI Whisper** or **Mozilla DeepSpeech**.
   - Translate voice input using open-source models or custom Sinhala-Tamil dictionary.
   - Display transcription and translation in real-time with language switch option.

2. OCR Document Translator
   - Scan typed or handwritten Sinhala/Tamil government documents.
   - Use **Tesseract OCR** for image-to-text conversion.
   - Automatically translate and display both source and translated text side-by-side.

3. Rajabasha Bilingual Practice Assistant
   - Vocabulary flashcards
   - Quiz module with mock Rajabasha exams
   - Real-life scenario simulations (e.g., hospital forms, GN complaints, court records)
   - Sinhala↔Tamil language pair focus

4. 2A Monitoring Dashboard (Activity & Accuracy)
   - Admin-only view with:
   - Officer-wise usage statistics
   - Translation logs (fake/mock data allowed)
   - Quiz/training progress
   - "Needs help" flag system

UI/UX Requirements:

Design Principles
   - Mobile-first and responsive layout (works on desktop & Android phones)
   - Use **Tailwind CSS** or **Bootstrap 5**
   - Minimal text-based navigation for semi-literate users
   - Icon-based buttons with Sinhala/Tamil tooltips
   - Voice input support
   - Simple navigation with 3–4 main tabs

UI Features
   - Toggle between **Sinhala / Tamil / English** UI labels
   - Theme Switching (Light / Dark / Auto - based on system preference)
   - Language selection dropdown at top right (persistent using localStorage)
   - Loading animations and audio feedback for actions
   - Pop-up alerts and confirmations in native language
   - Text size adjustment option for visually impaired users

Accessibility Features
   - High-contrast color mode
   - Screen reader support (WCAG Level AA)
   - Keyboard navigability
   - Offline support for key modules (PWA mode)

Interface Components
   - Dashboard cards: Quiz score, translation stats, weekly activity
   - Voice recorder with waveform animation
   - OCR file upload with instant preview and dual-language output
   - Flashcard slider with Sinhala/Tamil terms
   - Modal pop-ups for Rajabasha exam mock attempts
   - Sidebar menu with simple icons (Home, OCR, Voice, Practice, Admin)

Core details: 

- **Frontend**: HTML, CSS (Tailwind or Bootstrap), JS or React
- **Backend**: PHP + MySQL (via XAMPP) — for full offline/local deployment
- **OCR**: Tesseract.js or Python-based Tesseract wrapper
- **STT**: OpenAI Whisper (local or API), or DeepSpeech
- **Translation**: Custom Sinhala↔Tamil glossary or open bilingual corpus
- **Data Format**: JSON for quizzes, translation logs
- **Deployment**: Localhost via XAMPP or optionally on cPanel
- **Version Control**: GitHub-ready structure

Deliverables (Auto-generate or output-ready)

- `Folder structure` with full codebase split into `frontend`, `backend`, `models`, `data`
- `Theme switching component` (with system theme detection + localStorage toggle)
- `Voice module` integrated with waveform UI
- `OCR module` for document translation with preview
- `Training assistant` with flashcards and quiz scoring system
- `Admin dashboard` for tracking system usage
- `UI kit` with all common components, buttons, icons
- `README.md` with install & usage guide
- `Sinhala/Tamil test samples` (text & audio for local test use)

More ideas : 
- Simulated usage metrics (for demo dashboard)
- Sinhala/Tamil language toggle on first load
- Include screenshots or wireframes if possible
