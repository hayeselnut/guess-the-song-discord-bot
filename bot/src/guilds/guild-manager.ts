import db from '../db/db';
import { GuildConfig, LeaderboardPoints } from '../types/game';
import Guild from './guild';

import DefaultConfig from '../assets/default-config.json';

class GuildManager {
  _guilds: { [id: string]: Guild } = {};

  constructor() {
    this._guilds = {};
    this._loadGuilds();
  }

  async _loadGuilds() {
    const snapshot = await db.collection('guilds').get();
    snapshot.forEach((doc) => {
      const { leaderboard, ...guildConfig } = doc.data();
      this._guilds[doc.id] = new Guild(
        doc.id,
        guildConfig as GuildConfig,
        leaderboard as LeaderboardPoints,
      );
    });
  }

  getOrCreate(guildId: string) {
    if (!(guildId in this._guilds)) {
      // Create new guild manager
      this._guilds[guildId] = new Guild(guildId);

      // Upload to database
      db.collection('guilds').doc(guildId).set({ ...DefaultConfig, leaderboard: {} });
    }

    return this._guilds[guildId];
  }
};

export default new GuildManager();
