export const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

export const sleep = async (ms) => await new Promise((resolve) => setTimeout(resolve, ms));

export const randInt = (start, end) => Math.floor(Math.random() * (end - start) + start);

export const parseRoundLimit = (limit) => {
  const base = 10;
  return parseInt(limit, base);
};
