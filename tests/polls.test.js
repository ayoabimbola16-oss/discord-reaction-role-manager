import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllPollVoters } from '../src/polls.js';

function collection(ids) {
  const map = new Map(ids.map((id) => [id, { id }]));
  map.lastKey = () => [...map.keys()].at(-1);
  return map;
}

function answer(id, fetchFn) {
  return [id, { fetchVoters: fetchFn }];
}

test('deduplicates voters across multiple poll answers and paginates', async () => {
  const calls = [];
  const pagedFetch = async ({ after }) => {
    calls.push(after);
    if (after) return collection(['u101']);
    return collection(Array.from({ length: 100 }, (_, i) => `u${i + 1}`));
  };
  const simpleFetch = async () => collection(['u1', 'u102']);
  const message = {
    poll: {
      answers: new Map([
        answer('1', pagedFetch),
        answer('2', simpleFetch)
      ])
    }
  };
  const users = await fetchAllPollVoters(message);
  assert.equal(users.size, 102, 'should have 102 unique users');
  assert.deepEqual(calls, [undefined, 'u100'], 'should paginate the first answer');
  assert.ok(users.has('u1'), 'u1 should exist (appears in both answers)');
  assert.ok(users.has('u102'), 'u102 should exist (from second answer)');
});

test('returns empty set when poll has no voters', async () => {
  const message = {
    poll: {
      answers: new Map([
        answer('1', async () => collection([])),
        answer('2', async () => collection([]))
      ])
    }
  };
  const users = await fetchAllPollVoters(message);
  assert.equal(users.size, 0);
});

test('throws when message does not contain a poll', async () => {
  await assert.rejects(
    () => fetchAllPollVoters({ poll: null }),
    { message: 'The specified message does not contain a Discord poll.' }
  );
  await assert.rejects(
    () => fetchAllPollVoters({}),
    { message: 'The specified message does not contain a Discord poll.' }
  );
});

test('handles single answer with a few voters', async () => {
  const message = {
    poll: {
      answers: new Map([
        answer('1', async () => collection(['alice', 'bob', 'charlie']))
      ])
    }
  };
  const users = await fetchAllPollVoters(message);
  assert.equal(users.size, 3);
  assert.ok(users.has('alice'));
  assert.ok(users.has('bob'));
  assert.ok(users.has('charlie'));
});
