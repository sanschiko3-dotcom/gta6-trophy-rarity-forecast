const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inv = (x) => 100 / (1 + Math.exp(-x));
const logit = (v) => Math.log((clamp(v, 0.01, 99.99) / 100) / (1 - clamp(v, 0.01, 99.99) / 100));

export function makeSynthetic(template) {
  const firstAt = Date.parse('2026-11-19T00:00:00Z');
  const history = [];
  const base = template.trophies.map((_, i) => i < 27 ? 8 + (i % 7) * 1.2 : 5 + (i % 7) * 1.1);
  const directions = template.trophies.map((t, i) => i < 27 ? 1 : -1);
  const slopes = directions.map((d, i) => d * (0.32 + (i % 5) * 0.025));
  for (let minute = 0; minute <= 2880; minute += 10) {
    const day = minute / 1440;
    const players = Math.round(1000 * Math.exp(Math.log(5) * day / 2));
    const rates = base.map((rate, i) => Number(inv(logit(rate) + slopes[i] * day).toFixed(2)));
    const at = new Date(firstAt + minute * 60000).toISOString();
    history.push({ slot: at, at, players_tracked: players, trophies_earned: 943, rates });
  }
  const checkpoint = new Date(firstAt + 2880 * 60000).toISOString();
  const horizon = 4.5 * 1440;
  const testCase = {
    ...template,
    id: 'synthetic-4p5d',
    at: checkpoint,
    horizon_minutes: horizon,
    target: new Date(Date.parse(checkpoint) + horizon * 60000).toISOString(),
    history,
  };
  const truth = base.map((rate, i) => Number(inv(logit(rate) + slopes[i] * 4.5).toFixed(2)));
  return { testCase, truth, directions, playersStart: history[0].players_tracked, playersEnd: history.at(-1).players_tracked };
}
