import db from '../helpers/firestore-helpers';
import { Config } from '../types/game';
import GuildManager from './guild-manager';

import DefaultConfig from '../assets/default-config.json';

class Guilds {
  _guilds: { [id: string]: GuildManager } = {};
  constructor() {
    this._guilds = {};

    this._loadGuilds();
  }

  async _loadGuilds() {
    const snapshot = await db.collection('guilds').get();
    snapshot.forEach((doc) => {
      this._guilds[doc.id] = new GuildManager(doc.data() as Config);
    });
  }

  getOrCreate(guildId: string) {
    if (!(guildId in this._guilds)) {
      // Create new guild manager
      this._guilds[guildId] = new GuildManager();

      // Upload to database
      db.collection('guilds').doc(guildId).set({ ...DefaultConfig, leaderboard: {} });
    }

    return this._guilds[guildId];
  }
};

export default new Guilds();
