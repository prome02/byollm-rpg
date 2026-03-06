# byollm-rpg — BYOLLM Interactive Script Engine

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?logo=vite)
![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.38-06B6D4?logo=tailwindcss)
![License: AGPL-v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)

**Demo:** https://byollm-rpg.pages.dev

---

## Project Overview

**byollm-rpg** is an AI-driven interactive script engine. The core concept is **BYOLLM** (Bring Your Own LLM) — you connect your own model, and the engine drives the narrative.

The first bundled script, **Neon Hell 2088**, is a LLM-generated test scenario set in a cyberpunk Taiwan, 2088. It is not the product — it is proof that the engine works.

Built with **Vite + React 19 + TypeScript + Tailwind CSS 4**.

---

## Try It Now

No installation required. Visit the demo site and bring an **OpenRouter** API key:

**https://byollm-rpg.pages.dev**

Your API key is stored only in your browser's localStorage and never sent to our servers.

---

## Features

- **BYOLLM** – Connect your own Ollama instance or any OpenRouter model.
- **Script engine** – `meta.json` + `milestones.json` define story structure; LLM drives the narrative.
- **Dynamic choice text** – LLM rewrites choice labels in real time to match the generated narrative.
- **Free input** – Players can type any action beyond the preset choices.
- **Local-first saves** – Progress stored in localStorage, no account required.
- **Open source under AGPL-3.0** – Fork it, run your own scripts.
- **Buy Me a Coffee** – Support the developer https://buymeacoffee.com/prome02

---

## Tech Stack

- **Vite** – Lightning-fast dev server and build tool
- **React 19** – Modern UI library
- **TypeScript 5** – Static typing
- **Tailwind CSS 4** – Utility-first CSS framework
- **Ollama / OpenRouter** – Player-provided LLM backend (BYOLLM)

---

## Getting Started

### Prerequisites

- Node.js v18+ and npm
- A running Ollama instance **or** an OpenRouter API key (https://openrouter.ai/keys)

### Install dependencies

```bash
npm install
```

### Development mode

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for production

```bash
npm run build
```

The built files are in `dist/`. Preview with `npm run preview`.

---

## Project Structure

```text
src/
├── App.tsx                # Main application component
├── main.tsx               # Application entry point
├── index.css              # Global styles
├── App.css                # UI-specific styles
└── utils/                 # Utility functions

public/
├── assets/generated/      # AI-generated images
├── data/scripts/          # Script files (meta.json + milestones.json)
└── scenarios/             # Scenario manifest
```

---

## License

This project is licensed under the **AGPL-3.0** license. See the [LICENSE](LICENSE) file for details.

---

## Contributing

Feel free to open Issues or submit Pull Requests. Please follow these guidelines:

1. Respect the existing code style and formatting.
2. Add appropriate comments and documentation for new features.
3. Update relevant documentation (including this README).

---

For the Traditional Chinese version, see [readme_zh.md](readme_zh.md).
