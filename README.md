# devlogs 📝

<p align="center">
  <img src="assets/logo.png" alt="devlogs Logo" width="200" style="image-rendering: pixelated;">
</p>

> Automated daily commit reports powered by Gemini AI, delivered to Discord and Telegram.

## Features

- 🔍 **Scans commits** from the current day.
- 🤖 **Generates a concise summary** using Google Gemini AI.
- 🚀 **Sends reports** to Discord Webhooks and/or Telegram Bots.
-  interactive **CLI prompt** to choose destination if both are configured.
- 📦 **Supports multiple projects** via a script.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **Git** installed and available in PATH.
- A **Google Gemini API Key** (Get it [here](https://aistudio.google.com/)).
- A **Discord Webhook URL** (optional).
- A **Telegram Bot Token** and **Chat ID** (optional).

## Installation

### From NPM (Recommended)

```bash
npx devlogs
```

### From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/anthuanvasquez/devlogs.git
   cd devlogs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the package globally:
   ```bash
   npm link
   ```

## Configuration

Create a `.env` file in the root of your project or where you intend to run the script (or set them as system environment variables):

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional (at least one is required)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

## Usage

Navigate to any git repository and run:
`devlogs [today|yesterday] [--discord] [--telegram]`

```bash
# Default (today, ask if multiple targets)
devlogs

# Report for yesterday
devlogs yesterday

# Force send to Discord (skip prompt)
devlogs today --discord

# Force send to Telegram (skip prompt)
devlogs yesterday --telegram

# Send to both without prompt
devlogs --discord --telegram
```

If multiple destinations are configured, you will be prompted to choose:
`¿Dónde deseas enviar el reporte? (discord/telegram/ambos) [ambos]:`

### Running for Multiple Projects

You can create a `projects.json` file with an array of absolute paths to your projects:

```json
[
  "/path/to/project-a",
  "/path/to/project-b"
]
```

Then run the included script:

```bash
./run-all-projects.sh
```

## Automating with Cron

To run it automatically every day at 6:00 PM:

1. Open your crontab:
   ```bash
   crontab -e
   ```

2. Add the following line (adjust paths accordingly):
   ```bash
   0 18 * * 1-5 /path/to/dev-logs/run-all-projects.sh >> /tmp/cron_devlogs.txt 2>&1
   ```

## License

MIT