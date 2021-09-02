"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
const firestore_helpers_1 = require("./helpers/firestore-helpers");
const spotify_1 = __importDefault(require("./spotify/spotify"));
const guild_manager_1 = __importDefault(require("./guilds/guild-manager"));
const help_json_1 = __importDefault(require("./assets/help.json"));
const discord_helpers_1 = require("./helpers/discord-helpers");
const leaderboard_1 = __importDefault(require("./guilds/game/leaderboard"));
const helpers_1 = require("./helpers/helpers");
dotenv.config();
(0, helpers_1.verifyEnv)();
const db = (0, firestore_helpers_1.getFirestoreDatabase)(process.env.FIREBASE_PROJECT_ID, process.env.FIREBASE_PRIVATE_KEY, process.env.FIREBASE_CLIENT_EMAIL);
const guilds = {};
(0, helpers_1.loadGuilds)(db, guilds);
const guildManager = new guild_manager_1.default(db);
const spotify = new spotify_1.default(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
const token = process.env.DISCORD_BOT_TOKEN;
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
    ],
    makeCache: discord_js_1.Options.cacheWithLimits({ MessageManager: {
            maxSize: 25,
            sweepInterval: 600,
        } }),
});
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});
client.on('messageCreate', (message) => {
    console.log(Object.keys(guilds).length);
    if (!(0, helpers_1.isValidMessage)(message))
        return;
    if (message.author.bot)
        return;
    if (message.content.includes('@here') || message.content.includes('@everyone'))
        return;
    // TODO: refactor so guild manager processes the command
    const prefix = guildManager.getConfig(message.guild.id)?.prefix || '$';
    if (message.mentions.has(client.user.id)) {
        help(message, prefix);
    }
    if (message.content.startsWith(prefix)) {
        readCommand(message, prefix);
    }
    else {
        guildManager.checkGuess(message);
    }
});
const readCommand = (message, prefix) => {
    if (message.content.startsWith(`${prefix}start`)) {
        start(message, prefix);
    }
    else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message);
    }
    else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message);
    }
    else if (message.content.startsWith(`${prefix}leaderboard`)) {
        leaderboard(message);
    }
    else if (message.content.startsWith(`${prefix}config`)) {
        config(message);
    }
    else if (message.content.startsWith(`${prefix}help`)) {
        help(message, prefix);
    }
    else {
        (0, discord_helpers_1.sendEmbed)(message.channel, `Invalid command. Use \`${prefix}help\` for a list of commands.`);
    }
};
const start = async (message, prefix) => {
    const args = (0, discord_helpers_1.parseMessage)(message);
    if (args.length < 3) {
        const [startHelp] = help_json_1.default.game_commands.filter((help) => help.usage.startsWith('start'));
        return (0, discord_helpers_1.sendEmbed)(message.channel, `Usage: \`${prefix}${startHelp.usage}\``);
    }
    const roundLimit = (0, helpers_1.parseRoundDuration)(args[1]);
    if (isNaN(roundLimit)) {
        return (0, discord_helpers_1.sendEmbed)(message.channel, `\`${args[1]}\` is not a valid round limit. Round limit must be an integer.`);
    }
    if (guildManager.hasActiveGameInGuild(message.guild.id)) {
        return (0, discord_helpers_1.sendEmbed)(message.channel, `There's already a game running!`);
    }
    if (!(0, helpers_1.isValidMessageWithVoiceChannel)(message)) {
        return (0, discord_helpers_1.sendEmbed)(message.channel, 'You need to be in a voice channel to play music');
    }
    // TODO: maybe just do client.user
    // const permissions = voiceChannel.permissionsFor(message.client.user);
    // if (permissions && (!permissions.has('CONNECT') || !permissions.has('SPEAK'))) {
    //   return sendEmbed(message.channel, 'I need the permissions to join and speak in your voice channel');
    // }
    const playlistLinks = args.slice(2);
    const playlists = await spotify.getPlaylists(playlistLinks);
    if (!playlists) {
        return (0, discord_helpers_1.sendEmbed)(message.channel, 'No tracks found');
    }
    const { name, img, tracks } = playlists;
    guildManager.initializeGame(message, name, img, tracks, roundLimit);
};
const stop = (message) => {
    if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
        return (0, discord_helpers_1.sendEmbed)(message.channel, 'Nothing to stop here!');
    }
    guildManager.finishGame(message.guild.id);
};
const skip = (message) => {
    if (!guildManager.hasActiveGame(message.guild.id, message.channel.id)) {
        return (0, discord_helpers_1.sendEmbed)(message.channel, 'Nothing to skip here!');
    }
    guildManager.skipRound(message.guild.id, message.channel.id);
};
const leaderboard = (message) => {
    const leaderboard = new leaderboard_1.default(guildManager.getLeaderboard(message.guild.id));
    const leaderboardEmbed = new discord_js_1.MessageEmbed()
        .setTitle('📊 All Time Leaderboard')
        .setDescription(leaderboard.toString());
    message.channel.send({ embeds: [leaderboardEmbed] });
};
const config = (message) => {
    const args = (0, discord_helpers_1.parseMessage)(message);
    if (args.length === 1) {
        const config = guildManager.getConfig(message.guild.id);
        const configEmbed = new discord_js_1.MessageEmbed()
            .setTitle('Current configurations')
            .setDescription(`\`\`\`${Object.entries(config).map(([key, value]) => `${key}: ${value}`).join('\n')}\`\`\``);
        message.channel.send({ embeds: [configEmbed] });
    }
    else {
        const key = args[1];
        if (key === 'reset') {
            return guildManager.resetConfig(message);
        }
        const value = args[2];
        if (!key || !value) {
            return (0, discord_helpers_1.sendEmbed)(message.channel, 'Unknown config arguments');
        }
        switch (key) {
            case 'prefix':
                guildManager.updatePrefix(value, message);
                break;
            case 'round_duration':
                guildManager.updateRoundDuration(value, message);
                break;
            default:
                return (0, discord_helpers_1.sendEmbed)(message.channel, 'Unknown config arguments');
        }
    }
};
const help = (message, prefix) => {
    const helpEmbed = new discord_js_1.MessageEmbed()
        .setTitle('🤖 Hello, I\'m Guess the Song Bot!')
        .setDescription(help_json_1.default.description)
        .addField('Game commands', help_json_1.default.game_commands.map((cmd) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'))
        .addField('Help commands', help_json_1.default.help_commands.map((cmd) => `${cmd.emoji} \`${prefix}${cmd.usage}\`: ${cmd.description}`).join('\n\n'));
    message.channel.send({ embeds: [helpEmbed] });
};
client.login(token);
