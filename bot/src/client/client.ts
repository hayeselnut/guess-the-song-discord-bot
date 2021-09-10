import { Client, Intents, Options } from 'discord.js';

export default new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: {
      maxSize: 25,
      sweepInterval: 600,
    },
  }),
});
