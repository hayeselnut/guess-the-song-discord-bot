export type GuildConfig = {
  prefix: string,
  round_duration: number,
  emote_nearly_correct_guesses: boolean,
};

export type LeaderboardPoints = { [id: string]: number }

export type EndRoundReason = 'CORRECT' | 'TIMEOUT' | 'FORCE_SKIP' | 'FORCE_STOP' | 'LOAD_FAIL';
export type EndRoundCallback = (reason: EndRoundReason) => void;

export type EndGameReason = 'ALL_ROUNDS_PLAYED' | 'FORCE_STOP' | 'DISCONNECTED';
export type EndGameCallback = (reason: EndGameReason) => void;
