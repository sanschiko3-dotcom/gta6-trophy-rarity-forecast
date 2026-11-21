import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { score, persistence, scoreRates } from './pinball.mjs';
import { makeSynthetic } from './synthetic.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kit = '/home/hatch/workspace/makefun/kits-live/gta6-trophy-rarity-forecast-01-kit/gta6-trophy-rarity-forecast-01-kit';
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tools/live-rates-2026-11-19.json'), 'utf8'));
const live = JSON.parse(fs.readFileSync(path.join(root, 'tools/live-rates-2026-11-21.json'), 'utf8'));
const names = [
  'Vice Got a Price!', 'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!',
  'Top Of The World, Ma', 'You Gotta Know When to Get Off', 'Trust', 'Break the Bank', 'Family Matters',
  'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'A Long Road', 'Cunning Stunts', 'Master of None', 'The Shootist',
  'Top Fun', 'Earn Cash, Not Kudos', 'Baited My Tackle', 'Stick Fiddler', 'Road to Rehabilitation',
  'This Was No Boat Accident', 'The Lone Rider', 'Strangers & Freaks', 'Supply & Demand', 'Spin On This!',
  'Positive Mental Attitude', 'Fair Game', "Don't Touch My Deck", 'You WAiNKer!', 'One Last Thing', 'Hot Together',
  'Retail Therapy', 'Whip It Good', 'Gunslinger', 'Catch Me If You Can', 'Challenging Tank', 'Sneakthief',
  'Maximum Withdrawal', 'A Classic Blitz Play', 'The Goodtime State', 'Pest Control', 'In The Beginning…',
  'Capital Offense', 'Let’s Go Bowling', 'Personal Best', 'Actions Speak Louder', 'Bad Luck, I Guess',
  'The Truth Is Out There', 'Ten Pin', 'Dime on the Dollar', 'Treat Yo Self', 'Little Boxes', 'On the Spot',
];
if (fixture.rates.length !== names.length || live.rates.length !== names.length) throw new Error('expected 55 table entries');

const readCase = (id) => JSON.parse(fs.readFileSync(path.join(kit, 'input', `${id}.in`), 'utf8'));
function assertOrder(c) {
  if (c.trophies.length !== 55 || c.trophies.some((t, i) => t.name !== names[i])) {
    throw new Error(`${c.id}: observed refresh order does not match the trophy names`);
  }
}
function runCase(c, options = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'gta6-v3-'));
  const input = path.join(temp, 'input');
  const output = path.join(temp, 'output');
  fs.mkdirSync(input);
  fs.mkdirSync(output);
  fs.writeFileSync(path.join(input, `${c.id}.in`), JSON.stringify(c));
  const start = process.hrtime.bigint();
  const run = spawnSync(process.execPath, [path.join(root, 'main.ts')], {
    env: { ...process.env, MAKEFUN_INPUT_DIR: input, MAKEFUN_OUTPUT_DIR: output,
      GTA6_TIME_AXIS: options.axis || 'linear', GTA6_DISABLE_FLAT_PRIOR: options.disablePrior ? '1' : '0',
      GTA6_FALLBACK_SIGMA: String(options.fallbackSigma || 4.0), GTA6_GENERAL_SPREAD: String(options.generalSpread || 1.5) },
    encoding: 'utf8', timeout: 8000,
  });
  const runtimeMs = Number(process.hrtime.bigint() - start) / 1e6;
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(`main.ts failed: ${run.stderr}`);
  const outFile = path.join(output, `${c.id}.out`);
  if (!fs.existsSync(outFile)) throw new Error(`${c.id}: missing output`);
  const bytes = fs.statSync(outFile).size;
  if (bytes > 65536) throw new Error(`${c.id}: output is ${bytes} bytes`);
  const result = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  if (Object.keys(result).join(',') !== 'trophies' || result.trophies.length !== c.trophies.length) throw new Error(`${c.id}: row count or keys invalid`);
  for (let i = 0; i < c.trophies.length; i++) {
    const row = result.trophies[i];
    if (row.id !== c.trophies[i].id || !Array.isArray(row.q) || row.q.length !== 5 ||
      row.q.some((v) => !Number.isFinite(v) || v < 0 || v > 100) ||
      row.q.some((v, j) => j > 0 && v < row.q[j - 1])) throw new Error(`${c.id}: invalid forecast row ${i}`);
  }
  const raw = fs.readFileSync(outFile, 'utf8');
  fs.rmSync(temp, { recursive: true, force: true });
  return { result, bytes, runtimeMs, raw };
}

const practice = ['p00', 'p01'].map(readCase);
practice.forEach(assertOrder);
if (fixture.rates.length !== 55) throw new Error('practice table must contain 55 rates');
const format = {};
const practiceScores = [];
const proxyScores = [];
for (const c of practice) {
  const first = runCase(c);
  const second = runCase(c);
  if (first.raw !== second.raw) throw new Error(`${c.id}: output is not deterministic`);
  const real = scoreRates(c, fixture.rates, first.result);
  const proxy = scoreRates(c, c.history.at(-1).rates, first.result);
  practiceScores.push(real.loss);
  proxyScores.push(proxy.loss);
  format[c.id] = { rows: first.result.trophies.length, bytes: first.bytes, runtime_ms: Number(first.runtimeMs.toFixed(1)), second_runtime_ms: Number(second.runtimeMs.toFixed(1)) };
}

const source = readCase('p01');
const liveCase = {
  ...source,
  id: 'live-2p18d',
  at: source.history.at(-1).at,
  target: live.fetched_at,
  horizon_minutes: Math.round((Date.parse(live.fetched_at) - Date.parse(source.history.at(-1).at)) / 60000),
};
const liveByName = liveCase.trophies.map((_, i) => live.rates[i]);
const livePredictions = {};
for (const axis of ['logtime', 'linear']) {
  livePredictions[axis] = runCase(liveCase, { axis });
}
const livePriorOff = runCase(liveCase, { disablePrior: true, fallbackSigma: 3.5 });
const fallbackCalibration = {};
for (const sigma of [2.75, 3.0, 3.5, 4.0]) {
  const prediction = runCase(liveCase, { fallbackSigma: sigma });
  fallbackCalibration[sigma] = scoreRates(liveCase, liveByName, prediction.result);
}
const livePersist = persistence(liveCase);
const liveMetrics = {
  logtime: scoreRates(liveCase, liveByName, livePredictions.logtime.result),
  linear: scoreRates(liveCase, liveByName, livePredictions.linear.result),
  flat_prior_disabled: scoreRates(liveCase, liveByName, livePriorOff.result),
  persistence: scoreRates(liveCase, liveByName, livePersist),
};

const synthetic = makeSynthetic(source);
const syntheticMetrics = {};
const syntheticPredictions = {};
for (const axis of ['logtime', 'linear']) {
  syntheticPredictions[axis] = runCase(synthetic.testCase, { axis });
  syntheticMetrics[axis] = scoreRates(synthetic.testCase, synthetic.truth, syntheticPredictions[axis].result);
}
const syntheticSpreadSweep = {};
for (const scale of [1.2, 1.4, 1.5, 1.7]) {
  const prediction = runCase(synthetic.testCase, { generalSpread: scale });
  syntheticSpreadSweep[scale] = scoreRates(synthetic.testCase, synthetic.truth, prediction.result);
}
const syntheticPersistence = persistence(synthetic.testCase);
syntheticMetrics.persistence = scoreRates(synthetic.testCase, synthetic.truth, syntheticPersistence);
const lastSyntheticRates = synthetic.testCase.history.at(-1).rates;
const directionChecks = syntheticPredictions.linear.result.trophies.map((row, i) =>
  (row.q[2] - lastSyntheticRates[i]) * synthetic.directions[i] > 0);
const runtime = Object.fromEntries(['logtime', 'linear'].map((axis) => [axis, {
  live_ms: Number(livePredictions[axis].runtimeMs.toFixed(1)),
  synthetic_ms: Number(syntheticPredictions[axis].runtimeMs.toFixed(1)),
}]));

const selected = liveMetrics.logtime.loss + syntheticMetrics.logtime.loss <= liveMetrics.linear.loss + syntheticMetrics.linear.loss ? 'logtime' : 'linear';
const report = {
  practice: { per_case: practiceScores, mean: Number((practiceScores.reduce((a, b) => a + b, 0) / practiceScores.length).toFixed(6)), format, last_read_proxy_per_case: proxyScores, last_read_proxy_mean: Number((proxyScores.reduce((a, b) => a + b, 0) / proxyScores.length).toFixed(6)) },
  live_backtest: { horizon_days: Number((liveCase.horizon_minutes / 1440).toFixed(4)), ...liveMetrics, fallback_sigma_sweep: fallbackCalibration },
  synthetic: { history_reads: synthetic.testCase.history.length, population: [synthetic.playersStart, synthetic.playersEnd], ...syntheticMetrics, spread_sweep: syntheticSpreadSweep, direction_pass: directionChecks.filter(Boolean).length },
  selected_time_model: selected,
  runtime_ms: runtime,
};
console.log(JSON.stringify(report, null, 2));

if (report.practice.mean > 0.01) throw new Error('practice grade exceeds 0.01');
if (liveMetrics[selected].loss >= liveMetrics.persistence.loss) throw new Error('live model did not beat persistence');
if (syntheticMetrics[selected].loss >= syntheticMetrics.persistence.loss || report.synthetic.direction_pass !== 55) throw new Error('synthetic gate failed');
if (fallbackCalibration[3.5].loss >= liveMetrics.persistence.loss) throw new Error('flat-history dilution shift must beat persistence');
