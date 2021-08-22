export const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

export const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));

export const randInt = (start: number, end: number) => Math.floor(Math.random() * (end - start) + start);

export const parseRoundDuration = (limit: string) => {
  const base = 10;
  return parseInt(limit, base);
};
