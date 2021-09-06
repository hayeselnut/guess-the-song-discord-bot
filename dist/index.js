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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const guild_manager_1 = __importDefault(require("./guilds/guild-manager"));
const client_1 = __importDefault(require("./client/client"));
const bot_helpers_1 = require("./helpers/bot-helpers");
client_1.default.once('ready', () => {
    console.log('Ready!');
    console.log(Object.keys(guild_manager_1.default._guilds).length, 'guilds found in Firestore');
    console.log('Current guilds:', client_1.default.guilds.cache.size);
});
client_1.default.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client_1.default.once('disconnect', () => {
    console.log('Disconnect!');
});
client_1.default.on('messageCreate', (message) => {
    if (!(0, bot_helpers_1.isValidMessage)(message))
        return;
    if (message.author.bot)
        return;
    if (message.content.includes('@here') || message.content.includes('@everyone'))
        return;
    guild_manager_1.default.getOrCreate(message.guild.id).readMessage(message);
});
const token = process.env.DISCORD_BOT_TOKEN;
client_1.default.login(token);
