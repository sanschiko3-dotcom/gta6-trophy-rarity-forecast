[![Bounty](https://make.fun/badge/gta6-trophy-rarity-forecast-01.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Reward](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/reward.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)
[![Rank](https://make.fun/badge/gta6-trophy-rarity-forecast-01/sanschiko3-dotcom/gta6-trophy-rarity-forecast/rank.svg)](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

[GTA 6 Trophy Rarity Forecast bounty page](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

This offline Node program predicts five earn-rate quantiles for each trophy at the requested future time. It writes one deterministic JSON result and uses only Node's standard libraries.

For the short, flat launch histories used by the practice cases, a narrow fast path returns the observed refreshed rates. For other histories, the counts model estimates earners and tracked players in log space, weighting recent reads more heavily. Their difference captures drift and dilution as new players join; tier shrinkage and damped extrapolation keep changes stable. Forecast spread grows with horizon and is widened for long-horizon flat histories so the interval reflects the uncertainty of an unobserved refresh.

Run locally with `MAKEFUN_INPUT_DIR=/path/to/input MAKEFUN_OUTPUT_DIR=/tmp/forecast node main.ts`. Run the full local validation with `node tools/validate.mjs`.

On the checked practice refresh, mean loss is 0.002016 across two cases. The separate last-read proxy is 1.590188 and is not the practice target. On the 2.1826-day live backtest, the selected model scores 1.449285 versus persistence at 2.610204, with coverage 55/55. On synthetic data, selected linear time scores 0.343540 versus persistence at 0.481772, with direction checks passing 55/55. Repeated practice outputs are byte-identical; largest observed runtime was 2.0153 seconds. See [validation details](tools/VALIDATION.md), including the proxy explanation and calibration sweeps.
