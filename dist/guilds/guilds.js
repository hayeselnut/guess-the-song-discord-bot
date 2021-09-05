"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_helpers_1 = __importDefault(require("../helpers/firestore-helpers"));
const guild_state_1 = __importDefault(require("./guild-state"));
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
class Guilds {
    constructor() {
        this._guilds = {};
        this._guilds = {};
        this._loadGuilds();
    }
    async _loadGuilds() {
        const snapshot = await firestore_helpers_1.default.collection('guilds').get();
        snapshot.forEach((doc) => {
            const { leaderboard, ...guildConfig } = doc.data();
            this._guilds[doc.id] = new guild_state_1.default(guildConfig, leaderboard);
        });
    }
    getOrCreate(guildId) {
        if (!(guildId in this._guilds)) {
            // Create new guild manager
            this._guilds[guildId] = new guild_state_1.default();
            // Upload to database
            firestore_helpers_1.default.collection('guilds').doc(guildId).set({ ...default_config_json_1.default, leaderboard: {} });
        }
        return this._guilds[guildId];
    }
}
;
exports.default = new Guilds();