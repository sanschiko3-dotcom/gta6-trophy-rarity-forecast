import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { score } from './pinball.mjs';
import { synthetic } from './synthetic.mjs';

assert(process.argv[2], 'Pass the kit directory as the first argument');
const kit = resolve(process.argv[2]);
const main = process.argv[3] ? resolve(process.argv[3]) : fileURLToPath(new URL('../main.ts', import.meta.url));
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const temporary = mkdtempSync(join(tmpdir(), 'trophy-forecast-'));
const input = join(temporary, 'input');
mkdirSync(input);

async function run(entry, data, label) {
  const output = join(temporary, label);
  const start = performance.now();
  await promisify(execFile)(process.execPath, [entry], {
    env: { ...process.env, MAKEFUN_INPUT_DIR: input, MAKEFUN_OUTPUT_DIR: output },
    timeout: 8000,
  });
  const ms = performance.now() - start;
  const bytes = readFileSync(join(output, data.id + '.out'));
  assert(bytes.length <= 65_536);
  const forecast = JSON.parse(bytes);
  assert.deepEqual(Object.keys(forecast), ['trophies']);
  assert.equal(forecast.trophies.length, 55);
  assert.deepEqual(forecast.trophies.map(row => row.id), data.trophies.map(row => row.id));
  for (const row of forecast.trophies) {
    assert.deepEqual(Object.keys(row).sort(), ['id', 'q']);
    assert.equal(row.q.length, 5);
    assert(row.q.every((q, i) => Number.isFinite(q) && q >= 0 && q <= 100 && (!i || q >= row.q[i - 1])));
  }
  return { bytes, forecast, ms };
}

async function check(data) {
  writeFileSync(join(input, data.id + '.in'), JSON.stringify(data));
  try {
    const first = await run(main, data, 'first');
    const second = await run(main, data, 'second');
    assert.deepEqual(first.bytes, second.bytes);
    console.log(data.id, first.bytes.length, 'bytes, identical, ms', first.ms.toFixed(1), second.ms.toFixed(1));
    return first.forecast;
  } finally {
    rmSync(join(input, data.id + '.in'));
  }
}

async function backtest(data, answer, mode) {
  const forecast = await check(data);
  writeFileSync(join(input, data.id + '.in'), JSON.stringify(data));
  try {
    const baseline = (await run(join(kit, 'starter/main.ts'), data, 'baseline')).forecast;
    const model = score(data.trophies, forecast, answer);
    const persistence = score(data.trophies, baseline, answer);
    console.log(data.id, { model, persistence });
    if (mode === 'practice') {
      assert(model.loss <= 0.10);
      assert.equal(model.covered, 55);
      assert.deepEqual(forecast.trophies.map(({ q }) => q[2]), answer.map(rate => Math.max(0.01, Math.min(99.99, rate))));
    } else {
      assert(model.loss < persistence.loss);
      assert(model.covered >= 44);
    }
    if (mode === 'synthetic') {
      const previous = data.history.at(-1).rates;
      const matches = forecast.trophies.filter(({ q }, i) =>
        Math.sign(q[2] - previous[i]) === Math.sign(answer[i] - previous[i])).length;
      console.log('Correct synthetic median directions:', matches);
      assert.equal(matches, 55);
    }
  } finally {
    rmSync(join(input, data.id + '.in'));
  }
}

try {
  const practice = ['p00', 'p01'].map(id => read(join(kit, 'input', id + '.in')));
  for (const data of practice) await backtest(data, data.history.at(-1).rates, 'practice');
  const fixture = read(new URL('./live-rates-2026-11-19-1503.json', import.meta.url));
  const source = practice[1];
  assert(source.trophies.every(({ id, description }, i) => id === i + 1 && description.length));
  const at = source.history.at(-1).at;
  const minutes = (Date.parse(fixture.fetched_at) - Date.parse(at)) / 60_000;
  await backtest({ ...source, id: 'live', at, target: fixture.fetched_at, horizon_minutes: minutes }, fixture.rates);
  const test = synthetic(source);
  await backtest(test.input, test.answer, 'synthetic');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
