import 'dotenv/config';
import { parseCli, HELP } from './cli.js';
import { createConfig } from './config.js';
import { createLogger } from './logger.js';
import { createDiscordClient, validateGuildAndRole } from './discord.js';
import { findMessage } from './messageFinder.js';
import { fetchAllReactionUsers } from './reactions.js';
import { processUsers, safeError } from './roles.js';

async function main() {
  const parsed = parseCli(process.argv.slice(2));
  if (parsed.help) { console.log(HELP); return; }
  const config = createConfig(parsed);
  const logger = createLogger();
  const started = Date.now();
  logger.header(config);
  const client = createDiscordClient();
  try {
    logger.info('Authenticating with Discord...');
    await client.login(config.token);
    const { guild, role } = await validateGuildAndRole(client, config);
    logger.info(`Server found: ${guild.name}`);
    const message = await findMessage(guild, config.messageId, config.channelId, logger);
    logger.info(`Message found in #${message.channel?.name || message.channelId}.`);
    logger.info('Fetching reaction users...');
    const userIds = await fetchAllReactionUsers(message, config.emoji);
    if (userIds.size === 0) logger.info(config.emoji ? 'No users reacted with the selected emoji.' : 'No users reacted to this message.');
    else logger.info(`Unique users found: ${userIds.size}`);
    const summary = await processUsers({ guild, role, userIds, action: config.action, dryRun: config.dryRun, logger });
    logger.summary(summary, config.action, Date.now() - started);
    process.exitCode = 0;
  } finally { client.destroy(); }
}

main().catch((error) => { console.error(`Fatal error: ${safeError(error)}`); console.error('Use --help for usage.'); process.exitCode = 1; });
