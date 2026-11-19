# Fresh validation

Plain `node main.ts`, Node 24.22.1, two executions per case. All outputs byte-identical, 55 matching IDs, five ordered finite quantiles, within 65536 bytes and 8 seconds. Synthetic directions all passed.

| Case | Loss | Persistence | Coverage | Runtime max ms |
|---|---:|---:|---:|---:|
| p00 proxy | .032514 | .024854 | 55/55 | 1974.83 |
| p01 proxy | .032514 | .024854 | 55/55 | 2903.70 |
| Live fixture | 1.107292 | 2.372746 | 55/55 | 2781.38 |
| Synthetic | .169426 | .290512 | 55/55 | 2599.96 |

Practice answers are unavailable here: these are last-read proxies, NOT sealed practice scores. Live uses the supplied 15:03 fixture and checkpoint-relative horizon. Synthetic uses 289 reads, 5x population growth and damped future continuation; it checks mechanics, not independent realism. Backtests informed tuning; coverage is in-sample, not independent calibration.

Initial proxy loss .059974 and 54/55 coverage motivated gating the short-horizon tail and fixing the 100% upper endpoint. These corrections landed with the initial commit because the first commit attempt was blocked by read-only git metadata. Revision 1 increased sigma floor from .012 to .018 (variance), yielding .032514 proxy loss and a ~.164 short-horizon sigma. Revision 2 increased long-horizon stale-history lower-tail growth from 5 to 6, improving live loss 1.184601 to 1.107292. Long-horizon sigma remains ~.805. No median refresh prior is applied; flat histories retain persistence medians.

Run: `node tools/validate.mjs /path/to/kit`.
