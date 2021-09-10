"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
    ],
    makeCache: discord_js_1.Options.cacheWithLimits({
        MessageManager: {
            maxSize: 25,
            sweepInterval: 600,
        },
    }),
});
