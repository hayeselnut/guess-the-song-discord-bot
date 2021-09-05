import db from '../helpers/firestore-helpers';
import { GuildConfig, LeaderboardPoints } from '../types/game';
import GuildState from './guild-state';

import DefaultConfig from '../assets/default-config.json';

class Guilds {
  private _guilds: { [id: string]: GuildState } = {};
  constructor() {
    this._guilds = {};

    this._loadGuilds();
  }

  async _loadGuilds() {
    const snapshot = await db.collection('guilds').get();
    snapshot.forEach((doc) => {
      const { leaderboard, ...guildConfig } = doc.data();
      this._guilds[doc.id] = new GuildState(
        guildConfig as GuildConfig,
        leaderboard as LeaderboardPoints,
      );
    });
  }

  getOrCreate(guildId: string) {
    if (!(guildId in this._guilds)) {
      // Create new guild manager
      this._guilds[guildId] = new GuildState();

      // Upload to database
      db.collection('guilds').doc(guildId).set({ ...DefaultConfig, leaderboard: {} });
    }

    return this._guilds[guildId];
  }
};

export default new Guilds();
