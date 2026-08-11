# Discord Reaction Role Manager

One-shot CLI utility for adding or removing a Discord role for every current server member who reacted to a specified message. It starts, performs one operation, prints a summary, and exits; it is **not** a continuously running bot.

## Problem solved

Discord moderators can use one message’s reactions as a temporary opt-in or poll result, then apply or remove a role in one deliberate command. The tool includes all reactions by default, deduplicates people who used more than one emoji, and continues if an individual member cannot be processed.

## Features

- `ADD` and `REMOVE` operations from a local command line
- Server ID, message ID, role ID, and action
- Optional `--channel` fast path; channel ID is never required
- Locates a message by scanning accessible guild text channels and active threads
- Fetches every reaction and paginates each reaction’s users (100 per request)
- Deduplicates users across Unicode and custom-emoji reactions
- Handles departed members, existing roles, absent roles, empty reactions, and per-member errors
- Optional `--emoji` and safe `--dry-run`
- Token stays in `DISCORD_BOT_TOKEN`; it is never printed

## Requirements

- Node.js 20 or newer
- A Discord application bot installed in the target server
- Permission to run Node.js locally

## Installation

```bash
git clone https://github.com/YOUR-USERNAME/discord-reaction-role-manager.git
cd discord-reaction-role-manager
npm install
copy .env.example .env
```

On macOS/Linux, use `cp .env.example .env`. Edit `.env` and set only:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
```

Do not commit `.env`. It is ignored by Git.

## Discord application and bot setup

1. In the [Discord Developer Portal](https://discord.com/developers/applications), create an application and add a Bot.
2. Copy the bot token into `DISCORD_BOT_TOKEN` in your local `.env` file. Reset the token immediately if it is ever exposed.
3. In **OAuth2 → URL Generator**, select the `bot` scope.
4. Select only these bot permissions: **View Channels**, **Read Message History**, and **Manage Roles**.
5. Invite the generated URL to the test server.
6. In the server’s Roles settings, drag the bot role **above** the role this program will manage.

The bot must have View Channel and Read Message History in every channel that may be searched. It requires Manage Roles, and Discord will reject changes to a role at or above the bot’s highest role. No privileged gateway intent is required by this implementation: it fetches individual current members only after finding a reaction user.

## CLI usage

```bash
npm run add -- --server SERVER_ID --message MESSAGE_ID --role ROLE_ID
npm run remove -- --server SERVER_ID --message MESSAGE_ID --role ROLE_ID
```

Examples:

```bash
npm run add -- --server 123456789012345678 --message 234567890123456789 --role 345678901234567890
npm run remove -- --server 123456789012345678 --message 234567890123456789 --role 345678901234567890
```

Get help:

```bash
npm start -- --help
```

### Environment fallback and precedence

The token must be supplied only through `DISCORD_BOT_TOKEN`. The three IDs can optionally be stored in `.env` as `DISCORD_SERVER_ID`, `DISCORD_MESSAGE_ID`, and `DISCORD_ROLE_ID`. Precedence is:

1. CLI option
2. Environment variable
3. Clear error

### Optional arguments

```bash
# Avoid scanning when the message channel is known.
--channel CHANNEL_ID

# Process only one emoji. Default: process all reactions.
--emoji "👍"
--emoji "name:id"

# Print intended role changes without changing Discord.
--dry-run
```

For a custom emoji, use the emoji representation shown by Discord/discord.js (normally `name:id`). Without `--emoji`, the utility processes every reaction, including Unicode and custom emoji.

## How it works

1. Validates action and IDs, then authenticates with the bot token.
2. Fetches the guild and target role and verifies the role is editable by the bot.
3. Uses `--channel` when supplied; otherwise, tries the specified message ID in each accessible message-capable guild channel and active thread.
4. Collects users from every matching reaction. Each reaction’s users are fetched in pages of up to 100 until exhausted, then user IDs are deduplicated.
5. Fetches each current member. For `ADD`, it adds the role only when absent; for `REMOVE`, it removes it only when present.
6. Logs every change, skip, and individual failure; prints a final summary; exits.

Example output:

```text
Action: ADD
Server: 123456789012345678
Message: 234567890123456789
Role: 345678901234567890

Locating message across accessible text channels and active threads...
Message found in #test-channel.
Fetching reaction users...
Unique users found: 4
[ADD] Ada#0001 (111...) - role added
[SKIP] Ben#0002 (222...) already has the role
[SKIP] 333... is no longer a member

Operation Complete
Reactors found: 4
Roles added: 2
Already had role: 1
Not in server: 1
Failed: 0
```

## Message discovery and limitations

Discord’s API retrieves a specific message in a **channel**, not directly from a server-wide message ID. To preserve the bounty workflow, channel ID is optional: the script scans every accessible text channel plus active threads and stops at the first matching message. `--channel` is an optional optimisation and is useful in large servers.

The bot cannot search channels it cannot view or read, private threads it has not joined, or archived threads that are not returned as active. Give the bot the required access or provide `--channel` when applicable. The script does not use Discord’s guild message-search endpoint because it does not return message reactions reliably for this task.

## Reactions, pagination, and rate limits

All reactions are included by default. A person reacting with both 👍 and ❤️ is processed once. The reaction-user endpoint permits up to 100 users per request, so the program requests subsequent pages using Discord’s `after` cursor until the page is short. `discord.js` manages normal Discord REST rate-limit handling; this program makes requests sequentially and does not implement unbounded retries.

## Error handling and results

Fatal configuration or setup errors (missing token, invalid IDs, inaccessible guild/message, missing role, or role hierarchy) end with a non-zero exit code. An individual user failure is logged and processing continues. Empty reactions and departed members are normal, clean outcomes. A completed run with some member failures returns a summary containing `Failed` rather than stopping other members.

## Testing

Run the automated unit tests and source syntax checks:

```bash
npm test
npm run check
```

Unit tests mock Discord interactions; no token or live server is needed. They cover configuration validation, ADD, REMOVE, existing/absent roles, departed users, duplicate reaction users, pagination, empty reactions, and a per-user failure.

## Manual Discord integration test — required before submission

1. Create a new Discord test server and a `Reaction Test Role`.
2. Put the bot role above `Reaction Test Role`.
3. Create a test text channel, post one test message, and have at least two test accounts react with different emoji; one account should use two emoji.
4. Enable Developer Mode in Discord and copy the server, message, role, and optionally channel IDs.
5. Run the ADD command. Confirm each unique current reactor has the role exactly once.
6. Run the ADD command again. Confirm it logs existing roles as skipped and does not fail.
7. Run the REMOVE command. Confirm those roles are removed.
8. Run the REMOVE command again. Confirm it logs absent roles as skipped.
9. Test `--dry-run`, an empty-reaction message, and a channel the bot cannot access. Do not put a production server at risk during testing.

**Manual verification required:** no live token or Discord test server is included with this repository, so a real Discord API role update has not been run by the automated suite.

## Troubleshooting

- `Missing DISCORD_BOT_TOKEN`: create `.env` from `.env.example`; do not pass a token on the command line.
- `Message could not be located`: verify the IDs and bot permissions; use `--channel` if the message’s channel is known.
- `Target role was not found`: ensure the role ID belongs to the supplied server.
- `bot cannot manage the target role`: grant Manage Roles and move the bot’s highest role above the target role.
- `Unknown Member` skips: the reactor left the server and cannot receive a role.

## Security

Tokens are environment-only and are redacted from surfaced error text. `.env`, all `.env.*` files except `.env.example`, logs, and dependencies are excluded from Git. Never record a token in a terminal recording, screenshot, issue, or public repository.

## Project structure

```text
discord-reaction-role-manager/
├── src/
│   ├── cli.js
│   ├── config.js
│   ├── discord.js
│   ├── index.js
│   ├── logger.js
│   ├── messageFinder.js
│   ├── reactions.js
│   └── roles.js
├── tests/
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## 60–90 second demo plan

Use a real test server and the real project. Do not show `.env` or a token.

1. Show the server, the target role, and the bot role above it.
2. Show the test message with reactions from test users.
3. In a terminal with the token already loaded, run the ADD command and show its logs and summary.
4. Return to Discord and show the roles were added.
5. Run the REMOVE command and show its logs and summary.
6. Return to Discord and show the roles were removed.

Suggested narration: “This is Discord Reaction Role Manager, a one-shot local CLI. The bot can read this test channel and its role is above the target role. This message has reactions from several users, including one person who reacted twice. I run ADD with the server, message, and role IDs. The tool locates the message, paginates every reaction, deduplicates users, and reports each role change. Back in Discord, the target role is now assigned. Next I run REMOVE with the same IDs. It processes the same unique reactors and removes the role. The terminal summary confirms the result, and the program exits after the single operation.”

## Publishing to GitHub

Replace the URL with your account and create the repository as **public** in GitHub first:

```bash
git init
git add .
git status
git commit -m "Initial release: Discord reaction role manager"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/discord-reaction-role-manager.git
git push -u origin main
```

Before pushing, run `git status` and verify `.env`, `node_modules`, logs, recordings containing sensitive information, and real credentials are absent.

## License

MIT. See [LICENSE](LICENSE).
