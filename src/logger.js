export function createLogger(write = console.log) {
  return {
    header(config) {
      write('========================================');
      write('Discord Reaction & Poll Role Manager');
      write('========================================');
      write(`Action: ${config.action}`);
      write(`Type:   ${config.type.toUpperCase()}`);
      write(`Server: ${config.serverId}`);
      write(`Message: ${config.messageId}`);
      write(`Role: ${config.roleId}`);
      if (config.channelId) write(`Channel: ${config.channelId}`);
      if (config.emoji) write(`Emoji filter: ${config.emoji}`);
      if (config.dryRun) write('Mode: DRY RUN (no roles will change)');
      write('');
    },
    info(message) { write(message); },
    result(kind, message) { write(`[${kind}] ${message}`); },
    summary(summary, action, durationMs) {
      const verb = action === 'ADD' ? 'added' : 'removed';
      const satisfied = action === 'ADD' ? 'Already had role' : 'Already absent';
      write(''); write('========================================'); write('Operation Complete'); write('========================================');
      write(`Target users found: ${summary.reactors}`);
      write(`Roles ${verb}: ${summary.changed}`);
      write(`${satisfied}: ${summary.alreadySatisfied}`);
      write(`Not in server: ${summary.notMember}`);
      write(`Failed: ${summary.failed}`);
      if (summary.dryRun) write(`Would change: ${summary.wouldChange}`);
      write(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
      write('========================================');
    }
  };
}
