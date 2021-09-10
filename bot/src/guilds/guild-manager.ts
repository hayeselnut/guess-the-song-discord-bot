import { GuildConfig, LeaderboardPoints } from '../types/game';
import db from '../db/db';
import Guild from './guild';

import DefaultConfig from '../assets/default-config.json';

class GuildManager {
  private guilds: { [id: string]: Guild } = {};

  constructor() {
    this.loadGuilds();
  }

  get size(): number {
    return Object.keys(this.guilds).length;
  }

  getOrCreate(guildId: string) {
    if (!(guildId in this.guilds)) {
      // Create new guild manager
      this.guilds[guildId] = new Guild(guildId);

      // Upload to database
      db.collection('guilds').doc(guildId).set({ ...DefaultConfig, leaderboard: {} });
    }

    return this.guilds[guildId];
  }

  private async loadGuilds() {
    const snapshot = await db.collection('guilds').get();
    snapshot.forEach((doc) => {
      const { leaderboard, ...guildConfig } = doc.data();
      this.guilds[doc.id] = new Guild(
        doc.id,
        guildConfig as GuildConfig,
        leaderboard as LeaderboardPoints,
      );
    });
  }
};

export default new GuildManager();
