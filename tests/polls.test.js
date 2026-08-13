import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllPollVoters } from '../src/polls.js';

// Builds a fake REST response shaped like Discord's API response
function pollResponse(ids) {
  return { users: ids.map((id) => ({ id })) };
}

// Build a fake REST client that handles Routes.pollAnswerVoters calls
function fakeRest(answerMap) {
  return {
    get: async (route, { query } = {}) => {
      // route: /channels/ch/polls/msg/answers/{answerId}
      const answerId = parseInt(route.split('/').at(-1), 10);
      if (!answerMap[answerId]) {
        const err = new Error('Unknown Message'); err.status = 404; err.code = 10008; throw err;
      }
      // Simulate pagination: if 'after' is supplied, return second page
      const ids = answerMap[answerId];
      if (query?.after) return pollResponse(ids.slice(1));
      return pollResponse(ids);
    }
  };
}

function makeMessage(answerMap, channelId = 'ch', messageId = 'msg') {
  return { client: { rest: fakeRest(answerMap) }, channelId, id: messageId };
}

test('deduplicates voters across multiple poll answers', async () => {
  const msg = makeMessage({ 1: ['u1', 'u2', 'u3'], 2: ['u2', 'u4'] });
  const users = await fetchAllPollVoters(msg);
  assert.equal(users.size, 4, 'should deduplicate u2 and return 4 unique voters');
  assert.ok(users.has('u1'));
  assert.ok(users.has('u2'));
  assert.ok(users.has('u3'));
  assert.ok(users.has('u4'));
});

test('paginates an answer with 100+ voters', async () => {
  // First page: 100 users, second page (after): 1 user
  const firstPage = Array.from({ length: 100 }, (_, i) => `u${i + 1}`);
  const overrides = {
    get: async (route, { query } = {}) => {
      const answerId = parseInt(route.split('/').at(-1), 10);
      if (answerId === 1) return pollResponse(query?.after ? ['u101'] : firstPage);
      const err = new Error('Not found'); err.status = 404; throw err;
    }
  };
  const msg = { client: { rest: overrides }, channelId: 'ch', id: 'msg' };
  const users = await fetchAllPollVoters(msg);
  assert.equal(users.size, 101, 'should fetch 101 unique users across 2 pages');
});

test('returns empty set when poll answer has no voters', async () => {
  const msg = makeMessage({ 1: [], 2: [] });
  const users = await fetchAllPollVoters(msg);
  assert.equal(users.size, 0);
});

test('throws when message does not contain a poll', async () => {
  const msg = makeMessage({}); // no answers → all return 404
  await assert.rejects(
    () => fetchAllPollVoters(msg),
    { message: 'The specified message does not contain a Discord poll.' }
  );
});

test('handles single answer with a few voters', async () => {
  const msg = makeMessage({ 1: ['alice', 'bob', 'charlie'] });
  const users = await fetchAllPollVoters(msg);
  assert.equal(users.size, 3);
  assert.ok(users.has('alice'));
  assert.ok(users.has('bob'));
  assert.ok(users.has('charlie'));
});
