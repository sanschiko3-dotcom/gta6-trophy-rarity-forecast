[![Bounty](https://make.fun/badge/gta6-trophy-rarity-forecast-01.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Reward](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/reward.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Rank](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/rank.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

[GTA VI trophy forecast bounty](https://make.fun/bounty/gta6-trophy-rarity-forecast-01).

This offline program forecasts five earn-rate quantiles for every supplied trophy. It regresses log estimated earners and log tracked population with recent observations weighted more heavily. Their difference estimates dilution; tier shrinkage and damped extrapolation limit extreme moves. Flat histories keep their last-rate medians.

Uncertainty grows with forecast horizon. Short stale histories receive an extended lower tail at longer horizons to represent unobserved population refreshes. The implementation uses only Node standard libraries and writes deterministic JSON.

Run locally: `MAKEFUN_INPUT_DIR=/path/to/input MAKEFUN_OUTPUT_DIR=/tmp/forecast node main.ts`.

Validation: practice last-read proxy loss .032514 versus persistence .024854; live fixture 1.107292 versus 2.372746; synthetic .169426 versus .290512. All coverage 55/55, all outputs deterministic, maximum measured runtime 2.904 seconds. These are tuned in-sample backtests, not sealed practice scores. See tools/VALIDATION.md for limitations and reproduction.
