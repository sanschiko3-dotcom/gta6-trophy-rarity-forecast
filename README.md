[![Bounty](https://make.fun/badge/gta6-trophy-rarity-forecast-01.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Reward](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/reward.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Rank](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/rank.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

[View the make.fun bounty](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

# GTA VI trophy rarity forecast

The entry predicts five quantiles for the percentage of Exophase players who will have earned each PS5 trophy at the case target.

The model fits separate trends for log earners and log tracked players, weighting recent reads more heavily. It shrinks each trend toward zero and its trophy tier median, then projects the ratio of the counts. Faster player growth lowers the projected earn rate.

A stalled tracker can shift the median only when both the horizon and the observed history span at least six hours. The intervals widen with horizon and residual volatility. For shorter stalled histories, horizons of at least six hours allow extra uncertainty on the lower side without shifting the median.

Use Node 22 with native TypeScript support or newer. Pass the absolute kit path to the validator.

```sh
MAKEFUN_INPUT_DIR=/absolute/kit/input MAKEFUN_OUTPUT_DIR=/tmp/trophy-output node "$PWD/main.ts"
node "$PWD/tools/validate.mjs" /absolute/kit
```

With last-read rates as truth, each practice case scored 0.033341 versus 0.024854 for the kit starter. The fresh live backtest scored 1.026067 versus 2.367636, and the synthetic 4.5-day case scored 0.185033 versus 0.358744. The model covered 55 of 55 rates in each case, and all 55 synthetic medians moved in the expected direction. Every case produced byte-identical outputs across two runs, each under 2.9 seconds. These cases informed tuning. See [validation results](tools/VALIDATION.md).
