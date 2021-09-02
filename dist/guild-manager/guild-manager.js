"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_config_json_1 = __importDefault(require("../assets/default-config.json"));
class GuildManager {
    constructor(config = default_config_json_1.default) {
        this.config = config || default_config_json_1.default;
        this.game = null;
        this.leaderboard = {};
    }
    readCommand(message) {
        // Starts with prefix: read command
        // Mention: show help menu
        // Game ongoing: check guess
    }
}
exports.default = GuildManager;
