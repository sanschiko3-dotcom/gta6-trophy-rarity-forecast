[![Bounty](https://make.fun/badge/gta6-trophy-rarity-forecast-01.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Reward](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/reward.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Rank](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/rank.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

[View the make.fun bounty](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

# GTA VI trophy rarity forecast

The entry predicts five quantiles for the percentage of Exophase players who will have earned each PS5 trophy at the case target.

It fits a line to each trophy's logit rates, weighting recent reads more heavily. It shrinks the slope toward zero and the trophy's tier median, then damps and caps the projected change.

Population growth moderates positive drift for rare trophies. A short, stalled population series allows for dilution when the tracker refreshes. The quantiles reflect residual volatility, forecast horizon and uncertainty about a refresh.

Use Node 22 with native TypeScript support or newer. Pass the absolute kit path to the validator.

```sh
MAKEFUN_INPUT_DIR=/absolute/kit/input MAKEFUN_OUTPUT_DIR=/tmp/trophy-output node "$PWD/main.ts"
node "$PWD/tools/validate.mjs" /absolute/kit
```

See [validation results](tools/VALIDATION.md) for losses, coverage and runtime.
