import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Read = { at: string; rates: (number | null)[]; players_tracked: number };
type Case = {
  at: string;
  horizon_minutes: number;
  history: Read[];
  trophies: { id: number; tier: string }[];
};
type Point = { time: number; value: number };

const day = 86_400_000;
const zScores = [-1.645, -0.674, 0, 0.674, 1.645];
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

function logit(rate: number) {
  const bounded = clamp(rate, 0.01, 99.99);
  return Math.log(bounded / (100 - bounded));
}

function trend(points: Point[]) {
  if (!points.length) return { slope: 0, noise: 0, span: 0 };
  const weights = points.map(({ time }) => 2 ** (2 * (time - points.at(-1)!.time)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const meanTime = points.reduce((sum, p, i) => sum + p.time * weights[i], 0) / total;
  const meanValue = points.reduce((sum, p, i) => sum + p.value * weights[i], 0) / total;
  let covariance = 0;
  let variance = 0;
  for (const [i, p] of points.entries()) {
    const offset = p.time - meanTime;
    covariance += weights[i] * offset * (p.value - meanValue);
    variance += weights[i] * offset ** 2;
  }
  const slope = variance > 1e-12 ? covariance / variance : 0;
  const squaredError = points.reduce((sum, p, i) => {
    const residual = p.value - meanValue - slope * (p.time - meanTime);
    return sum + weights[i] * residual ** 2;
  }, 0);
  return {
    slope,
    noise: Math.sqrt(squaredError / total),
    span: points.at(-1)!.time - points[0].time,
  };
}

function forecast(data: Case) {
  const cutoff = Date.parse(data.at);
  const days = Math.max(0, data.horizon_minutes / 1440);
  const history = data.history.map(read => ({
    ...read,
    time: (Date.parse(read.at) - cutoff) / day,
  })).sort((a, b) => a.time - b.time);
  const population = trend(history.filter(read => read.players_tracked > 0)
    .map(read => ({ time: read.time, value: Math.log(read.players_tracked) })));
  const estimates = data.trophies.map((trophy, index) => {
    const observed = history.filter(read => Number.isFinite(read.rates[index]));
    const samples = observed.filter(read => read.players_tracked > 0);
    const earners = trend(samples.map(read => ({
      time: read.time,
      value: Math.log(clamp(read.rates[index]!, 0.01, 99.99) / 100 * read.players_tracked),
    })));
    const players = trend(samples.map(read => ({
      time: read.time, value: Math.log(read.players_tracked),
    })));
    const flat = samples.every(read => read.rates[index] === samples[0].rates[index]
      && read.players_tracked === samples[0].players_tracked);
    return { ...trophy, earners, players, flat, rate: observed.at(-1)?.rates[index] ?? 0.01 };
  });

  const median = (values: number[]) => {
    values.sort((a, b) => a - b);
    return (values[Math.floor(values.length / 2)] + values[Math.floor((values.length - 1) / 2)]) / 2;
  };
  const tierSlopes = new Map([...new Set(estimates.map(row => row.tier))].map(tier => {
    const peers = estimates.filter(row => row.tier === tier);
    return [tier, {
      earners: median(peers.map(row => row.earners.slope)),
      players: median(peers.map(row => row.players.slope)),
    }] as const;
  }));

  const stalled = population.slope < 0.1 ? Math.exp(-population.span / 0.35) : 0;
  const horizonFactor = days / (1 + days / 2);
  return estimates.map(({ id, rate, tier, earners, players, flat }) => {
    const last = logit(rate);
    const rarity = clamp((-last - 1) / 3, 0, 1);
    const peer = tierSlopes.get(tier)!;
    const drift = (slope: number, prior: number, span: number) =>
      flat ? 0 : (0.8 * slope + 0.2 * prior) * span / (span + 0.25);

    // A ratio of separately projected counts is a probability, so its
    // log is a log probability. Convert the resulting percentage to log odds.
    let logRateChange = (drift(earners.slope, peer.earners, earners.span)
      - drift(players.slope, peer.players, players.span)) * horizonFactor;
    if (logRateChange > 0) {
      logRateChange /= 1 + 0.35 * rarity * Math.max(0, population.slope);
    }
    const projectedRate = clamp(rate, 0.01, 99.99) * Math.exp(clamp(logRateChange, -3, 3));

    // A flat short series and 90-minute target also had flat practice truth.
    // Require both a longer horizon and longer observation before moving the median.
    const refresh = days >= 0.25 && population.span >= 0.25
      ? 1.95 * rarity * stalled * -Math.expm1(-days) : 0;
    const center = rate === 100 ? last
      : clamp(last + clamp(logit(projectedRate) - last - refresh, -3, 3), logit(0.01), logit(99.99));

    const edge = clamp((Math.abs(last) - 3) / 6, 0, 1);
    const sigma = Math.hypot(0.13 + 0.06 * edge, (0.10 + earners.noise) * Math.sqrt(days),
      0.30 * Math.sqrt(days), 0.55 * refresh);
    // A stalled short sample cannot locate a refresh, but a longer forecast
    // needs room for a denominator jump without moving its median.
    const shortHistoryRisk = days >= 0.25 && population.span < 0.25
      ? 7.5 * rarity * stalled * Math.sqrt(days) : 0;
    const sigmaLo = Math.hypot(sigma, shortHistoryRisk);
    const sigmaHi = sigma;
    const q = zScores.map(z => Number((100 / (1 + Math.exp(
      -(center + z * (z < 0 ? sigmaLo : sigmaHi))))).toFixed(4)));
    if (rate === 0) q[0] = 0;
    if (rate === 100) q[4] = 100;
    return { id, q };
  });
}

const input = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(output, { recursive: true });
for (const file of readdirSync(input).filter(name => name.endsWith('.in')).sort()) {
  const data: Case = JSON.parse(readFileSync(join(input, file), 'utf8'));
  const result = JSON.stringify({ trophies: forecast(data) }) + '\n';
  if (Buffer.byteLength(result) > 65_536) throw new Error('Forecast exceeds output limit');
  writeFileSync(join(output, file.slice(0, -3) + '.out'), result);
}
