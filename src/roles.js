function label(member, userId) { return member?.user?.tag ? `${member.user.tag} (${userId})` : userId; }

export async function processUsers({ guild, role, userIds, action, dryRun, logger }) {
  const summary = { reactors: userIds.size, changed: 0, alreadySatisfied: 0, notMember: 0, failed: 0, wouldChange: 0 };
  for (const userId of userIds) {
    let member;
    try { member = await guild.members.fetch({ user: userId, force: true }); }
    catch (error) {
      if (error?.code === 10007 || error?.status === 404) { summary.notMember += 1; logger.result('SKIP', `${userId} is no longer a member`); continue; }
      summary.failed += 1; logger.result('ERROR', `${userId} - ${safeError(error)}`); continue;
    }
    const hasRole = member.roles.cache.has(role.id);
    const needsChange = action === 'ADD' ? !hasRole : hasRole;
    if (!needsChange) { summary.alreadySatisfied += 1; logger.result('SKIP', `${label(member, userId)} ${action === 'ADD' ? 'already has the role' : 'does not have the role'}`); continue; }
    if (dryRun) { summary.wouldChange += 1; logger.result('DRY RUN', `${action} role for ${label(member, userId)}`); continue; }
    try {
      if (action === 'ADD') await member.roles.add(role, 'Reaction role manager one-shot operation');
      else await member.roles.remove(role, 'Reaction role manager one-shot operation');
      summary.changed += 1; logger.result(action, `${label(member, userId)} - role ${action === 'ADD' ? 'added' : 'removed'}`);
    } catch (error) { summary.failed += 1; logger.result('ERROR', `${label(member, userId)} - ${safeError(error)}`); }
  }
  return summary;
}

export function safeError(error) {
  const message = String(error?.message || 'Discord API request failed');
  return message.replace(/Bot\s+[\w.-]+/gi, 'Bot [REDACTED]');
}
