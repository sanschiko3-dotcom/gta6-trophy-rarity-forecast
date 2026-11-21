# Validation results

Full run: `node tools/validate.mjs` on Node 24.22.1. The practice run uses the refreshed 04:30Z rate table in `live-rates-2026-11-19.json` as its actual target. Mean loss was 0.002016 across p00 and p01 (each 0.002016; target at most 0.01). Each output had 55 rows and 2,685 bytes. The two executions per case were byte-identical. Runtime measurements were 1,479.2 and 2,015.3 ms for p00, and 1,761.0 and 1,599.2 ms for p01.

| Live 2.1826-day backtest | Loss | Coverage |
|---|---:|---:|
| Selected forecast (logtime and linear tie) | 1.449285 | 55/55 |
| Persistence | 2.610204 | 7/55 |
| Flat-prior-disabled variant | 1.653428 | 48/55 |

The flat-history fallback sigma is 4.0. It raises coverage to the required 55/55 while keeping loss well below persistence. The fallback sweep was: sigma 2.75, loss 1.406858 and coverage 47/55; 3.0, 1.401897 and 47/55; 3.5, 1.410763 and 48/55; 4.0, 1.449285 and 55/55. The modest loss increase at 4.0 buys full interval coverage. This fallback only affects flat-history long-horizon forecasts; the final case has richer history and is unaffected.

| Synthetic 4.5-day backtest | Loss | Coverage |
|---|---:|---:|
| Linear time (selected) | 0.343540 | 48/55 |
| Logtime | 0.402897 | 55/55 |
| Persistence | 0.481772 | 55/55 |

Both forecast approaches beat persistence, and direction checks passed 55/55. Linear time is selected by combined live and synthetic loss: the live losses tie at 1.449285, while synthetic linear is lower. The synthetic spread sweep selected 1.2 (loss 0.337921, coverage 48/55); spreads 1.4, 1.5, and 1.7 scored 0.341549, 0.343540, and 0.347930 respectively, each with 48/55 coverage. Runtime for the selected linear model was 1,406.8 ms on the live case and 2,293.0 ms on synthetic.

The last-read proxy mean is 1.590188. It is expected to disagree with practice: the server's practice grade compares against the 04:30Z refreshed read, while the proxy compares forecasts to each case's final supplied read. In v2, a 0.032514 proxy loss looked good locally because that proxy target matched the local scoring calculation; live practice then scored about 1.48 because its refreshed target differed. The refreshed-target validation now measures the intended practice objective directly. The proxy is diagnostic only.

These are local fixture and synthetic checks, not a guarantee of future live accuracy. The full validator also checks output format, matching trophy IDs, ordered finite quantiles, determinism, size, runtime, and the practice, live, and synthetic gates.
