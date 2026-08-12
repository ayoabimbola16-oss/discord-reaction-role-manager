# 🤖 Discord Reaction Role Manager

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-7%20passed-success.svg)]()

> A lightweight, **one-shot command-line utility** that automatically assigns or removes a Discord role for users who reacted to a specific message.

---

## ⚡ Quick Summary for Judges / Reviewers

This project was built to satisfy all requirements for the **"Create a Discord Script"** bounty ($60 USDC).

### 🏆 Bounty Requirement Compliance Checklist

| Bounty Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Accept Server ID** | ✅ | Via `--server` flag or `DISCORD_SERVER_ID` env variable |
| **Accept Message ID** | ✅ | Via `--message` flag or `DISCORD_MESSAGE_ID` env variable |
| **Accept Role ID** | ✅ | Via `--role` flag or `DISCORD_ROLE_ID` env variable |
| **Action: ADD** | ✅ | Finds reactors and assigns the role |
| **Action: REMOVE** | ✅ | Finds reactors and removes the role |
| **Not a Continuous Bot** | ✅ | **One-shot execution**: logs in, updates roles, prints summary, and exits |
| **Local Command Line** | ✅ | Easy execution via `node src/index.js` or `npm run` |
| **Environment Variables** | ✅ | Bot token stored safely in `.env` (never exposed/printed) |
| **Detailed Logging** | ✅ | Real-time console logs for every user (`[ADD]`, `[REMOVE]`, `[SKIP]`) + final summary |
| **Duplicate Reaction Handling**| ✅ | Deduplicates users who reacted with multiple emojis |
| **Edge Case Resilience** | ✅ | Skips users who already have/don't have the role without crashing |
| **Departed User Handling** | ✅ | Gracefully skips users who left the server |
| **Pagination Support** | ✅ | Fetches reactor lists in batches of 100 via cursor pagination |
| **Automated Tests** | ✅ | 7 unit tests covering config, reactions, deduplication, and roles |

---

## 📖 How It Works (In Simple Terms)

Think of this tool as an automated helper for Discord moderators:

```
[1. User reacts to message]  --->  [2. You run the script]  --->  [3. Script connects & finds reactors]
                                                                                │
                                                                                ▼
[5. Script displays summary & exits] <--- [4. Script adds/removes roles for reactors]
```

1. **You post a message** in your Discord server (e.g., *"React to this message to get the Tester role!"*).
2. **Users react** to the message with any emoji.
3. **You run the script** from your computer terminal (`npm run add`).
4. **The script connects to Discord**, finds all unique users who reacted, gives them the role, logs the results, and **immediately turns off**.

---

## 🚀 Quick Start Guide (Beginner Step-by-Step)

### Step 1: Prerequisites
Make sure you have **Node.js** (v20 or newer) installed on your computer.

### Step 2: Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR-USERNAME/discord-reaction-role-manager.git
cd discord-reaction-role-manager
npm install
```

### Step 3: Environment Setup
Copy the example environment file:

- **Windows (Command Prompt / PowerShell):**
  ```bash
  copy .env.example .env
  ```
- **macOS / Linux:**
  ```bash
  cp .env.example .env
  ```

Open the newly created `.env` file in your code editor and fill in your Discord Bot Token and IDs:

```env
# Required: Your Discord Bot Token
DISCORD_BOT_TOKEN=your_bot_token_here

# Optional: Default IDs (so you don't have to type them in the CLI every time)
DISCORD_SERVER_ID=123456789012345678
DISCORD_MESSAGE_ID=234567890123456789
DISCORD_ROLE_ID=345678901234567890
```

> ⚠️ **Security Note:** Never commit your `.env` file to GitHub or share your bot token! `.gitignore` automatically prevents `.env` from being tracked.

---

## 🎮 Discord Bot Setup & Permissions Guide

Follow these simple steps to configure your bot in Discord:

1. **Create Bot:** Go to the [Discord Developer Portal](https://discord.com/developers/applications), create a new application, and add a **Bot**.
2. **Copy Token:** Copy your Bot Token into `.env` under `DISCORD_BOT_TOKEN`.
3. **Invite Bot:** 
   - Navigate to **OAuth2 → URL Generator**.
   - Select scope: `bot`.
   - Select permissions: **View Channels**, **Read Message History**, **Manage Roles**.
   - Open the generated URL in your browser to invite the bot to your server.
4. **Configure Role Hierarchy (CRITICAL STEP):**
   - Go to your Discord **Server Settings → Roles**.
   - Ensure the Bot's highest role is positioned **ABOVE** the role you want it to assign (e.g. `Reaction Tester`).
   - *If the bot role is below the target role, Discord will block permission to assign it.*

---

## 💻 How to Run the Script

### Option A: Using Environment Variables (Easiest)
If you saved your IDs in `.env`, simply run:

```bash
# Add roles to all users who reacted
npm run add

# Remove roles from all users who reacted
npm run remove
```

### Option B: Passing IDs Directly via Command Line Flags

```bash
# ADD action:
npm run add -- --server 123456789012345678 --message 234567890123456789 --role 345678901234567890

# REMOVE action:
npm run remove -- --server 123456789012345678 --message 234567890123456789 --role 345678901234567890
```

### Additional Command Line Options

| Option | Example | Description |
| :--- | :--- | :--- |
| `--channel` | `--channel 987654321` | Direct channel search optimization (skips scanning all channels) |
| `--emoji` | `--emoji 👍` | Process reactions for a specific emoji only |
| `--dry-run` | `--dry-run` | Preview actions without modifying roles in Discord |
| `--help` | `--help` | Display CLI help menu |

---

## 🖥️ Example Output

When you execute the script, you will see clean, real-time feedback:

```text
========================================
Discord Reaction Role Manager
========================================
Action: ADD
Server: 1536883286515908699
Message: 1536891425659158661
Role: 1536883883075698708

Authenticating with Discord...
Server found: Reaction Role Manager Test
Locating message across accessible text channels and active threads...
Message found in #general.
Fetching reaction users...
Unique users found: 2
[ADD] Alice#0001 (111111111) - role added
[SKIP] Bob#0002 (222222222) already has the role

========================================
Operation Complete
========================================
Reactors found: 2
Roles added: 1
Already had role: 1
Not in server: 0
Failed: 0
Duration: 7.4s
========================================
```

---

## 🧪 Automated Testing

This repository includes comprehensive unit tests mocking Discord interactions to ensure reliability.

To run tests on your local machine:

```bash
node --test tests/config.test.js tests/reactions.test.js tests/roles.test.js
```

### Test Suite Covers:
- ✅ CLI option parsing & precedence over `.env`
- ✅ Validation of Snowflake IDs & invalid inputs
- ✅ Pagination of reactions (>100 users)
- ✅ Deduplication across multiple emojis
- ✅ Graceful handling of departed members & existing roles
- ✅ Error logging without crashing execution

---

## 🔒 Security & Privacy Features

- 🔐 **Token Protection:** The Bot Token is only read from `.env` and is **never** accepted as a CLI parameter.
- 🛡️ **Error Sanitization:** All printed error tracebacks sanitize tokens to prevent accidental log exposure.
- 🚫 **Git Protection:** `.env` is explicitly ignored in `.gitignore`.

---

## 📁 Repository Structure

```text
discord-reaction-role-manager/
├── src/
│   ├── cli.js            # Command-line argument parsing
│   ├── config.js         # Configuration validation & fallback logic
│   ├── discord.js        # Discord API client & role hierarchy checks
│   ├── index.js          # Core orchestrator & entry point
│   ├── logger.js         # Formatted CLI logger
│   ├── messageFinder.js   # Automated channel & thread message discovery
│   ├── reactions.js      # Reaction fetching, pagination & deduplication
│   └── roles.js          # Role addition/removal & error handling
├── tests/
│   ├── config.test.js    # Unit tests for CLI & configuration
│   ├── reactions.test.js # Unit tests for reaction deduplication
│   └── roles.test.js     # Unit tests for role processing
├── .env.example          # Environment template
├── .gitignore            # Git exclusion rules
├── LICENSE               # MIT License
├── package.json          # Project configuration & scripts
└── README.md             # Project documentation
```

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).
