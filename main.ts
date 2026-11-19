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
    const points = observed.map(read => ({ time: read.time, value: logit(read.rates[index]!) }));
    return { ...trophy, ...trend(points), rate: observed.at(-1)?.rates[index] ?? 0.01 };
  });
  const tierMedian = new Map<string, number>();
  for (const tier of new Set(estimates.map(row => row.tier))) {
    const slopes = estimates.filter(row => row.tier === tier)
      .map(row => row.slope).sort((a, b) => a - b);
    const middle = Math.floor(slopes.length / 2);
    tierMedian.set(tier, (slopes[middle] + slopes[Math.floor((slopes.length - 1) / 2)]) / 2);
  }

  return estimates.map(({ id, rate, tier, span, slope, noise }) => {
    const last = logit(rate);
    const rarity = clamp((-last - 1) / 3, 0, 1);
    let drift = (0.8 * slope + 0.2 * tierMedian.get(tier)!) * span / (span + 0.25);
    // New profiles attenuate gains in rare trophies when the tracker is expanding.
    if (drift > 0) drift /= 1 + 0.35 * rarity * Math.max(0, population.slope);
    // A short, stalled series may precede a population refresh.
    const stalled = population.slope < 0.1 ? Math.exp(-population.span / 0.35) : 0;
    const refresh = stalled * rarity * 1.6 * -Math.expm1(-days / 0.22);
    const center = last + (rate === 100 ? 0 : clamp(drift * days / (1 + days / 2) - refresh, -3, 3));
    const edge = clamp((Math.abs(last) - 3) / 6, 0, 1);
    const sigma = Math.hypot(0.20 + 0.06 * edge, (0.07 + noise) * Math.sqrt(days), 0.49 * refresh);
    const q = zScores.map(z => Number((100 / (1 + Math.exp(-(center + z * sigma)))).toFixed(4)));
    if (rate === 0) q[0] = 0;
    if (rate === 100) q[4] = 100;
    for (let i = 1; i < q.length; i++) q[i] = Math.max(q[i], q[i - 1]);
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
