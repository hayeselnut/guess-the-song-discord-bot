"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firestore_helpers_1 = __importDefault(require("../helpers/firestore-helpers"));
const guild_manager_1 = __importDefault(require("./guild-manager"));
const guilds = {};
const loadGuilds = async (guilds) => {
    const snapshot = await firestore_helpers_1.default.collection('guilds').get();
    snapshot.forEach((doc) => {
        guilds[doc.id] = new guild_manager_1.default(doc.data());
    });
};
loadGuilds(guilds);
exports.default = guilds;
