import assert from 'node:assert/strict';

const levels = [0.05, 0.25, 0.5, 0.75, 0.95];

function logit(rate) {
  const p = Math.max(0.01, Math.min(99.99, rate)) / 100;
  return Math.log(p / (1 - p));
}

export function score(trophies, forecast, rates) {
  const rows = new Map(forecast.trophies.map(({ id, q }) => [id, q]));
  assert.equal(rows.size, trophies.length);
  assert.equal(rates.length, trophies.length);
  let loss = 0;
  let covered = 0;
  for (const [index, { id }] of trophies.entries()) {
    const q = rows.get(id);
    const y = rates[index];
    assert(Number.isFinite(y));
    for (const [i, tau] of levels.entries()) {
      const d = logit(y) - logit(q[i]);
      loss += 2 * Math.max(tau * d, (tau - 1) * d);
    }
    covered += Number(q[0] <= y && y <= q[4]);
  }
  return { loss: Number((loss / (levels.length * trophies.length)).toFixed(6)), covered };
}
