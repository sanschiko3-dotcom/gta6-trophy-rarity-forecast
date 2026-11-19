# v2 validation

Run `node tools/validate.mjs /absolute/path/to/kit` with Node v24.22.1.
The backtests informed tuning and are in-sample. They do not establish independent calibration.

| Case | v2 pinball loss | Starter loss | v2 90% coverage | Starter 90% coverage | Output bytes | v2 runs (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Practice p00 | 0.033341 | 0.024854 | 55/55 (1.0000) | 54/55 (0.9818) | 2639 | 2597.6, 1584.8 |
| Practice p01 | 0.033341 | 0.024854 | 55/55 (1.0000) | 54/55 (0.9818) | 2639 | 1596.3, 1502.3 |
| Fresh live | 1.026067 | 2.367636 | 55/55 (1.0000) | 3/55 (0.0545) | 2679 | 1825.9, 1307.6 |
| Synthetic 4.5-day | 0.185033 | 0.358744 | 55/55 (1.0000) | 55/55 (1.0000) | 2832 | 2882.7, 1563.1 |

Practice truth is the last read. Medians match it after clipping to the scoring bounds.
The live backtest uses p01 history ending near 03:00 UTC and the supplied 15:03 UTC fixture on 2026-11-19, about 12 hours and 3 minutes apart. All 55 synthetic medians moved in the prescribed direction.

Each case had 55 matching IDs and five finite, non-decreasing quantiles per row in [0, 100]. Each output was below 65,536 bytes, byte-identical across the two runs, and produced within the 8-second limit.

The first pass scored 1.062530 live with 55/55 coverage. Increasing the short-history lower-tail scale from 7.0 to 7.5 lowered live loss by 0.036463 at the same coverage, with practice and synthetic scores unchanged. The live history was too short to trigger a median refresh. The lower tail allows dilution risk on horizons of at least six hours even when the median gate is closed.

The separate 1.25× lower and 0.85× upper multipliers for an active median refresh were dropped. At a fixed short-history scale of 7.5, toggling these multipliers changed live and synthetic losses by 0.000000 and covered counts by 0, because neither case activated the median refresh. The backtests therefore supply no evidence for those multipliers.

Using residual volatility from log earners gave synthetic loss of 0.185033 versus 0.189779 with logit-rate residuals. Coverage was 55/55 for both. Practice and live metrics were identical, so v2 uses log-earner residuals.
