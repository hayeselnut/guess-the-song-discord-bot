import ServerContract from './server-contract.js';

/**
 *  Represents a collection of server contracts
 */
export default class Database {
  /**
   *
   * @param {ytdl.videoInfo} songData - information for video
   */
  constructor() {
    this.serverContracts = new Map();
  }

  /**
   *
   * @param {Message} message - Discord message object
   * @return {ServerContract}
   */
  getContractForGuild(message) {
    const contract = this.serverContracts.get(guildId);
    if (!contract) {
      const serverContract = new ServerContract(message);
      this.serverContracts.set(message.guild.id, serverContract);
      return serverContract;
    } else {
      return contract;
    }
  }
}
