# Neon Hell 2088 - AI‑Driven Interactive Script Game

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?logo=vite)
![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.38-06B6D4?logo=tailwindcss)
![License: AGPL‑v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)

---

## Project Overview

**Neon Hell 2088** is an **AI‑driven interactive script game**. Players bring their own **Ollama** instance (BYOLLM) as the LLM backend. The game runs scripts defined by `meta.json` and `milestones.json` to drive narrative and interactions. It is built with **Vite + React 19 + TypeScript + Tailwind CSS 4** and follows a cyber‑punk aesthetic.

---

## Features

- **AI‑powered storytelling** – Leverage a locally hosted Ollama model for dynamic dialogue and plot.
- **Script engine** – `meta.json` holds script metadata; `milestones.json` defines story stages and events.
- **Open source under AGPL‑3.0** – Free to use, modify, and share while keeping derived works open.
- **Modern frontend stack** – React 19 with TypeScript, Vite for fast dev server, Tailwind CSS 4 for UI.
- **Buy Me a Coffee** – Support the developer https://buymeacoffee.com/prome02

---

## Tech Stack

- **Vite** – Lightning‑fast dev server and build tool
- **React 19** – Modern UI library
- **TypeScript 5** – Static typing
- **Tailwind CSS 4** – Utility‑first CSS framework
- **Ollama** – Player‑provided LLM backend (BYOLLM)

---

## Getting Started

### Prerequisites

- Node.js v18+ and npm
- A running Ollama service (you provide the model)

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
├── App.css                # UI‑specific styles
└── assets/                # Static assets

public/
├── assets/                # Public assets
│   └── generated/         # AI‑generated images
├── vite.svg
└── index.html

data/
├── scripts/
│   ├── neon-hell-2088/
│   │   ├── meta.json      # Script metadata
│   │   └── milestones.json# Story milestones
│   └── ...
└── savegame.json          # Player save file
```

---

## License

This project is licensed under the **AGPL‑3.0** license. See the [LICENSE](LICENSE) file for details.

---

## Contributing

Feel free to open Issues or submit Pull Requests. Please follow these guidelines:

1. Respect the existing code style and formatting.
2. Add appropriate comments and documentation for new features.
3. Ensure all tests pass.
4. Update relevant documentation (including this README).

---

For the Traditional Chinese version, see [readme_zh.md](readme_zh.md).
