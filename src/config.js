const SNOWFLAKE = /^\d{17,20}$/;

function idFrom(cliValue, envValue, label) {
  const value = cliValue || envValue;
  if (!value) throw new Error(`Missing ${label}. Pass --${label.toLowerCase()} or set DISCORD_${label}_ID.`);
  if (!SNOWFLAKE.test(value)) throw new Error(`${label} must be a valid Discord snowflake ID.`);
  return value;
}

export function createConfig(parsed, env = process.env) {
  if (!['ADD', 'REMOVE'].includes(parsed.action)) throw new Error('Action must be ADD or REMOVE.');
  const token = env.DISCORD_BOT_TOKEN;
  if (!token || token === 'replace_with_your_bot_token') throw new Error('Missing DISCORD_BOT_TOKEN in the environment.');
  const config = {
    action: parsed.action,
    serverId: idFrom(parsed.server, env.DISCORD_SERVER_ID, 'SERVER'),
    messageId: idFrom(parsed.message, env.DISCORD_MESSAGE_ID, 'MESSAGE'),
    roleId: idFrom(parsed.role, env.DISCORD_ROLE_ID, 'ROLE'),
    channelId: parsed.channel || env.DISCORD_CHANNEL_ID || undefined,
    emoji: parsed.emoji,
    dryRun: Boolean(parsed.dryRun),
    token
  };
  if (config.channelId && !SNOWFLAKE.test(config.channelId)) throw new Error('CHANNEL must be a valid Discord snowflake ID.');
  return config;
}
