"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffle = exports.throwIfInsufficientVoicePermissions = exports.parseStartGameArgs = void 0;
const help_json_1 = __importDefault(require("../assets/help.json"));
const client_1 = __importDefault(require("../client/client"));
const parseStartGameArgs = (args, prefix) => {
    if (args.length < 3) {
        const startHelp = help_json_1.default.commands.start;
        throw new Error(`Usage: \`${prefix}${startHelp.usage}\``);
    }
    const base = 10;
    const roundLimit = parseInt(args[1], base);
    if (isNaN(roundLimit)) {
        throw new Error(`\`${args[1]}\` is not a valid round limit. Round limit must be an integer.`);
    }
    const playlistLinks = args.slice(2);
    return { roundLimit, playlistLinks };
};
exports.parseStartGameArgs = parseStartGameArgs;
const throwIfInsufficientVoicePermissions = (message) => {
    const permissions = message.member.voice.channel.permissionsFor(client_1.default.user);
    if (permissions && !(permissions.has('CONNECT') && permissions.has('SPEAK'))) {
        throw new Error('I need the permissions to join and speak in your voice channel');
    }
};
exports.throwIfInsufficientVoicePermissions = throwIfInsufficientVoicePermissions;
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
exports.shuffle = shuffle;
