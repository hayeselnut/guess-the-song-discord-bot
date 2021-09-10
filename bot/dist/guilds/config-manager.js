"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const bot_helpers_1 = require("../helpers/bot-helpers");
const help_json_1 = __importDefault(require("../assets/help.json"));
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
const db_1 = __importDefault(require("../db/db"));
class ConfigManager {
    constructor(guildId, guildConfig) {
        this.guildId = guildId;
        this.guildConfig = guildConfig;
    }
    // Returns a copy of the config to prevent any concurrent changes affecting the returned object
    get config() {
        return {
            prefix: this.prefix,
            round_duration: this.roundDuration,
            emote_nearly_correct_guesses: false,
        };
    }
    get prefix() {
        return this.guildConfig.prefix;
    }
    get roundDuration() {
        return this.guildConfig.round_duration;
    }
    readConfigCommand(message) {
        const args = (0, bot_helpers_1.parseMessage)(message);
        if (args.length === 1) {
            return this.showConfig(message);
        }
        const configCmd = args[1];
        const parameter = args[2];
        switch (configCmd) {
            case 'reset':
                return this.resetConfig(message);
            case 'prefix':
                return this.setPrefix(parameter, message);
            case 'round_duration':
                return this.setRoundDuration(parameter, message);
            default:
                throw new Error(`Unknown config argument ${configCmd}`);
        }
    }
    showConfig(message) {
        const kv = Object.entries(this.guildConfig)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        const configEmbed = new discord_js_1.MessageEmbed()
            .setTitle('Current configurations')
            .setDescription(`\`\`\`${kv}\`\`\``);
        message.channel.send({ embeds: [configEmbed] });
    }
    resetConfig(message) {
        this.guildConfig.prefix = default_config_json_1.default.prefix;
        this.guildConfig.round_duration = default_config_json_1.default.round_duration;
        this.guildConfig.emote_nearly_correct_guesses = default_config_json_1.default.emote_nearly_correct_guesses;
        this.updateDatabase();
        (0, bot_helpers_1.sendEmbed)(message.channel, `Configs have been reset`);
    }
    setPrefix(value, message) {
        if (typeof value !== 'string') {
            const configPrefix = help_json_1.default.commands['config prefix'];
            throw new Error(`Usage: \`${this.prefix}${configPrefix.usage}\``);
        }
        this.guildConfig.prefix = value;
        this.updateDatabase();
        (0, bot_helpers_1.sendEmbed)(message.channel, `Prefix has been set to \`${this.prefix}\``);
    }
    setRoundDuration(value, message) {
        const newRoundDuration = parseInt(String(value), 10);
        if (isNaN(newRoundDuration) || newRoundDuration < 5) {
            const configRoundDuration = help_json_1.default.commands['config round_duration'];
            throw new Error(`Usage: \`${this.prefix}${configRoundDuration.usage}\`\n${configRoundDuration.description}`);
        }
        this.guildConfig.round_duration = newRoundDuration;
        this.updateDatabase();
        (0, bot_helpers_1.sendEmbed)(message.channel, `Round duration has been set to \`${this.roundDuration}\``);
    }
    updateDatabase() {
        db_1.default.collection('guilds').doc(this.guildId).set({
            prefix: this.prefix,
            round_duration: this.roundDuration,
            emote_nearly_correct_guesses: this.guildConfig.emote_nearly_correct_guesses,
        }, { merge: true });
    }
}
exports.default = ConfigManager;
;
