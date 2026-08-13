export async function fetchAllPollVoters(message) {
  if (!message.poll) {
    throw new Error('The specified message does not contain a Discord poll.');
  }
  const poll = message.poll;
  const userIds = new Set();
  const answers = [...poll.answers.values()];
  for (const answer of answers) {
    let after;
    do {
      const batch = await answer.fetchVoters({ limit: 100, after });
      for (const user of batch.values()) userIds.add(user.id);
      if (batch.size < 100) break;
      const nextAfter = batch.lastKey();
      if (!nextAfter || nextAfter === after) break;
      after = nextAfter;
    } while (true);
  }
  return userIds;
}
