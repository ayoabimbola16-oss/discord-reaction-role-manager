export const HELP = `Discord Reaction Role Manager\n\nUsage:\n  npm run add -- --server SERVER_ID --message MESSAGE_ID --role ROLE_ID [options]\n  npm run remove -- --server SERVER_ID --message MESSAGE_ID --role ROLE_ID [options]\n\nOptions:\n  --server ID       Discord server ID\n  --message ID      Discord message ID\n  --role ID         Discord role ID\n  --channel ID      Optional channel ID; avoids server-wide accessible-channel scan\n  --emoji EMOJI     Optional emoji filter (for example 👍 or name:id)\n  --dry-run         Report changes without modifying roles\n  --help, -h        Show this help\n\nPrecedence: CLI option > environment variable > error.\nEnvironment fallbacks: DISCORD_SERVER_ID, DISCORD_MESSAGE_ID, DISCORD_ROLE_ID, DISCORD_CHANNEL_ID.\nToken: DISCORD_BOT_TOKEN (required; never accepted on the command line).`;

export function parseCli(argv) {
  const [actionRaw, ...tokens] = argv;
  if (actionRaw === '--help' || actionRaw === '-h') return { help: true };
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === '--help' || token === '-h') return { help: true };
    if (token === '--dry-run') { options.dryRun = true; continue; }
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const name = token.slice(2);
    if (!['server', 'message', 'role', 'channel', 'emoji'].includes(name)) {
      throw new Error(`Unknown option: ${token}`);
    }
    const value = tokens[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Option ${token} requires a value.`);
    options[name] = value;
    index += 1;
  }
  return { action: actionRaw?.toUpperCase(), ...options };
}
