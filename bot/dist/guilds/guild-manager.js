"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../db/db"));
const guild_1 = __importDefault(require("./guild"));
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
class GuildManager {
    constructor() {
        this.guilds = {};
        this.loadGuilds();
    }
    get size() {
        return Object.keys(this.guilds).length;
    }
    getOrCreate(guildId) {
        if (!(guildId in this.guilds)) {
            // Create new guild manager
            this.guilds[guildId] = new guild_1.default(guildId);
            // Upload to database
            db_1.default.collection('guilds').doc(guildId).set({ ...default_config_json_1.default, leaderboard: {} });
        }
        return this.guilds[guildId];
    }
    async loadGuilds() {
        const snapshot = await db_1.default.collection('guilds').get();
        snapshot.forEach((doc) => {
            const { leaderboard, ...guildConfig } = doc.data();
            this.guilds[doc.id] = new guild_1.default(doc.id, guildConfig, leaderboard);
        });
    }
}
;
exports.default = new GuildManager();
