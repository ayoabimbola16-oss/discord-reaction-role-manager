import { Routes } from 'discord.js';

/**
 * Fetches all unique voter IDs from a Discord poll message.
 * Uses the REST API directly (/channels/{ch}/polls/{msg}/answers/{id})
 * so it does NOT rely on message.poll being populated in the cache.
 *
 * Discord polls support up to 10 answer options.
 * Pagination is handled with the 'after' cursor (100 voters per batch).
 * Voters who voted for multiple answers are deduplicated via Set.
 *
 * Throws an error if the message is not a poll (all answer IDs return 404).
 */
export async function fetchAllPollVoters(message) {
  const rest = message.client.rest;
  const channelId = message.channelId;
  const messageId = message.id;
  const userIds = new Set();
  let foundAtLeastOneAnswer = false;

  for (let answerId = 1; answerId <= 10; answerId++) {
    let after;
    let answerExists = true;

    do {
      let response;
      try {
        const query = { limit: 100 };
        if (after) query.after = after;
        response = await rest.get(
          Routes.pollAnswerVoters(channelId, messageId, answerId),
          { query }
        );
      } catch (error) {
        // 404 means this answer ID doesn't exist — stop trying further answers
        if (error.status === 404 || error.code === 10008) {
          answerExists = false;
          break;
        }
        throw error;
      }

      foundAtLeastOneAnswer = true;
      const voters = response.users ?? [];
      for (const user of voters) userIds.add(user.id);

      if (voters.length < 100) break;
      after = voters[voters.length - 1].id;
    } while (true);

    if (!answerExists) break;
  }

  if (!foundAtLeastOneAnswer) {
    throw new Error('The specified message does not contain a Discord poll.');
  }

  return userIds;
}
