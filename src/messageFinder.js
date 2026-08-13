function isMessageCapable(channel) {
  return channel?.isTextBased?.() && channel?.messages?.fetch && !channel.isDMBased?.();
}

async function tryMessage(channel, messageId) {
  try { return await channel.messages.fetch({ message: messageId, force: true }); }
  catch (error) {
    if ([10003, 10008, 50001, 50013].includes(error?.code) || error?.status === 404 || error?.status === 403) return null;
    throw error;
  }
}

export async function findMessage(guild, messageId, optionalChannelId, logger) {
  if (optionalChannelId) {
    const channel = await guild.channels.fetch(optionalChannelId);
    if (!channel || !isMessageCapable(channel)) throw new Error('The supplied channel is unavailable or cannot contain messages.');
    const message = await tryMessage(channel, messageId);
    if (!message) throw new Error('Message was not found in the supplied channel or the bot cannot access it.');
    return message;
  }
  logger.info('Locating message across accessible text channels and active threads...');
  const channels = await guild.channels.fetch();
  const activeThreads = await guild.channels.fetchActiveThreads().catch(() => ({ threads: new Map() }));
  const candidates = new Map();
  for (const channel of channels.values()) if (isMessageCapable(channel)) candidates.set(channel.id, channel);
  for (const thread of activeThreads.threads.values()) if (isMessageCapable(thread)) candidates.set(thread.id, thread);
  for (const channel of candidates.values()) {
    const message = await tryMessage(channel, messageId);
    if (message) return message;
  }
  throw new Error('Message could not be located in accessible text channels or active threads. Use --channel if you know its channel.');
}
