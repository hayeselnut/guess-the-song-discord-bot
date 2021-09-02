export type Config = {
  prefix: string,
  round_duration: number,
  emote_nearly_correct_guesses: boolean,
};

export type Leaderboard = { [id: string]: number }
