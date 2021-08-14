/**
 *  Represents a song
 */
export default class Song {
  /**
   *
   * @param {ytdl.videoInfo} songData - information for video
   */
  constructor(songData) {
    this.title = songData.videoDetails.title;
    this.url = songData.videoDetails.video_url;
  }
}
