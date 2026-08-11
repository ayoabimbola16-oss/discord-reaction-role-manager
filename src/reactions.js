export async function fetchAllReactionUsers(message, emojiFilter) {
  const userIds = new Set();
  const reactions = [...message.reactions.cache.values()].filter((reaction) => {
    if (!emojiFilter) return true;
    return reaction.emoji.identifier === emojiFilter || reaction.emoji.name === emojiFilter || reaction.emoji.toString() === emojiFilter;
  });
  for (const reaction of reactions) {
    let after;
    do {
      const batch = await reaction.users.fetch({ limit: 100, after });
      for (const user of batch.values()) userIds.add(user.id);
      if (batch.size < 100) break;
      const nextAfter = batch.lastKey();
      if (!nextAfter || nextAfter === after) break;
      after = nextAfter;
    } while (true);
  }
  return userIds;
}
