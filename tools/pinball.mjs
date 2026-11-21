const levels = [0.05, 0.25, 0.5, 0.75, 0.95];
const z = [-1.645, -0.674, 0, 0.674, 1.645];
const clamp = (v) => Math.max(0.01, Math.min(99.99, v));
const logit = (v) => {
  const p = clamp(v) / 100;
  return Math.log(p / (1 - p));
};
const inverse = (v) => 100 / (1 + Math.exp(-v));

export function score(answer, output) {
  let total = 0;
  let items = 0;
  let covered = 0;
  let absoluteMiss = 0;
  for (let i = 0; i < answer.trophies.length; i++) {
    const row = output.trophies[i];
    const y = answer.rates[i];
    const ly = logit(y);
    const median = row.q[2];
    absoluteMiss += Math.abs(y - median);
    if (y >= row.q[0] && y <= row.q[4]) covered++;
    for (let j = 0; j < levels.length; j++) {
      const d = ly - logit(row.q[j]);
      total += 2 * Math.max(levels[j] * d, (levels[j] - 1) * d);
      items++;
    }
  }
  return {
    loss: Number((total / items).toFixed(6)),
    coverage: covered,
    trophies: answer.trophies.length,
    coverageRate: Number((covered / answer.trophies.length).toFixed(4)),
    meanAbsoluteMissPoints: Number((absoluteMiss / answer.trophies.length).toFixed(4)),
  };
}

export function persistence(testCase) {
  const last = testCase.history.at(-1);
  const days = testCase.horizon_minutes / 1440;
  const sigma = 0.5 * Math.sqrt(days);
  return {
    trophies: testCase.trophies.map((t, i) => {
      const center = logit(last.rates[i]);
      return { id: t.id, q: z.map((v) => Number(inverse(center + v * sigma).toFixed(4))) };
    }),
  };
}

export function scoreRates(testCase, rates, output) {
  return score({ trophies: testCase.trophies, rates }, output);
}
