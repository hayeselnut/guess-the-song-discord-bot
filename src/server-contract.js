/**
 *  Represents a server contract
 */
export default class ServerContract {
  /**
   *
   * @param {Message} message - Discord message object
   */
  constructor(message) {
    this.textChannel = message.channel;
    this.voiceChannel = message.member.voice.channel;
    this.connection = null;
    this.songs = [];
    this.volume = 5;
    this.playing = true;
  }

  /**
   *
   * @param {VoiceChannel} voiceChannel - the destination voice channel
   */
  async connect(voiceChannel) {
    try {
      this.connection = await voiceChannel.join();
      this.voiceChannel = voiceChannel;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /**
   *
   * @param {Object} song - the song object containing information
   */
  enqueue(song) {
    this.songs.push(song);
  }
}
