import { Client, GatewayIntentBits } from 'discord.js';

export function createDiscordClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessagePolls,
    ]
  });
}

export async function validateGuildAndRole(client, config) {
  const guild = await client.guilds.fetch(config.serverId);
  const role = await guild.roles.fetch(config.roleId);
  if (!role) throw new Error('Target role was not found in this server.');
  if (role.managed) throw new Error('Target role is managed by an integration and cannot be assigned manually.');
  // Fetch the bot's own member to ensure guild.members.me is populated in the cache
  await guild.members.fetch(client.user.id);
  if (!role.editable) throw new Error('The bot cannot manage the target role. Give it Manage Roles and place its highest role above the target role.');
  return { guild, role };
}
