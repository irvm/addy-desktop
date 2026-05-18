# Project Mandates

- **Language Standard:** All code comments, documentation, and commit messages MUST be written in English.
- **Style:** Maintain a clean, professional, and descriptive commenting style.
- **Security:**
  - Sensitive information (API keys, personal tokens) MUST be stored in the system's native secure storage using `tauri-plugin-keyring`.
  - Never hardcode or log API keys.
- **Architecture:**
  - Frontend: React (TypeScript) with Tailwind CSS.
  - Backend: Rust (Tauri v2).
  - Storage: Use system keyring for secrets. Local JSON store can be used for non-sensitive settings (currently unused).
