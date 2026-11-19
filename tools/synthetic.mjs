export function synthetic(practice) {
  const start = Date.parse(practice.history[0].at);
  const timestamp = minutes => new Date(start + minutes * 60_000).toISOString();
  const horizon = 6480;
  const population = days => 800 * (1 + 2 * days);
  const rates = days => practice.trophies.map((_, i) => {
    const early = i % 5 === 1;
    const initial = early ? 35 + i % 17 : 0.4 + (i % 13) / 5;
    const growth = early ? 0.95 : 0.1 + (i % 11) * 0.07;
    // Progress compounds in the numerator while the tracker adds profiles.
    const dilution = Math.log(population(days) / population(0));
    const odds = initial / (100 - initial) * Math.exp(growth * Math.log1p(days) - dilution * (early ? 0.12 : 1));
    return Number((100 * odds / (1 + odds)).toFixed(4));
  });
  const history = Array.from({ length: 289 }, (_, i) => ({
    slot: timestamp(i * 10),
    at: timestamp(i * 10),
    players_tracked: Math.round(population(i / 144)),
    rates: rates(i / 144),
  }));
  return {
    input: {
      ...practice,
      id: 'synthetic',
      at: timestamp(2880),
      target: timestamp(2880 + horizon),
      horizon_minutes: horizon,
      history,
    },
    answer: rates(6.5),
  };
}
