# md-craft

> A lightweight, interactive Node.js CLI tool that transforms raw text and CSV/TSV data into publication-ready Markdown documentation with an automated Git pipeline.

---

## Features

- **Interactive Menu:** Walk through document creation step-by-step directly from your terminal.
- **Auto-Formatted Tables:** Instantly convert raw CSV or TSV data into clean, aligned Markdown tables.
- **GitHub Callout Support:** Native formatting for `NOTE`, `TIP`, `WARNING`, and `IMPORTANT` callout boxes.
- **Multi-Line Text Entry:** Easily write long paragraphs, bullet points, or code blocks using an `END` delimiter.
- **Automated Git Pipeline:** Option to automatically stage (`git add`), commit (`git commit`), and push (`git push`) generated documentation straight to your remote branch.
- **Unix Stdin Piping:** Supports piping CSV/TSV data directly via stdout (`cat data.csv | md-craft`).

---

## Installation

Clone the repository and register the command globally on your machine:

```bash
# 1. Clone the repository
git clone

# 2. Navigate into the project folder
cd md_Craft

# 3. Link the package globally
npm link
