# Validation

Run the validator with Node and the absolute kit directory. It executes the kit's TypeScript starter for the persistence comparison. Loss uses all 275 quantile predictions per case.

| Backtest | Forecast loss | Persistence loss | Forecast 90% coverage | Persistence 90% coverage |
|---|---:|---:|---:|---:|
| Live, 9 h 48 min | 0.279669 | 1.369894 | 55/55 | 0/55 |
| Synthetic, 4.5 days | 0.128750 | 0.358744 | 55/55 | 55/55 |

The live fixture is the supplied 12:48 UTC Exophase read on November 19, aligned to p01 by the verified source order. Its horizon starts at the 03:00 UTC history read. The synthetic case has two days of ten minute reads and fivefold population growth during history. All 55 synthetic medians moved in the prescribed direction.

The first version scored 0.381661 live and 0.146633 synthetic with full coverage. Narrowing the intervals improved synthetic loss to 0.124943 and reduced coverage to 45/55. Live loss rose to 0.401748 with coverage of 32/55. The final version allows more dilution after a stalled read and restores some interval width. Both cases informed tuning, so these results measure fit to the tests and do not establish independent calibration.

| Case | Output bytes | Run 1 | Run 2 |
|---|---:|---:|---:|
| p00 | 2744 | 850.1 ms | 983.2 ms |
| p01 | 2807 | 1292.5 ms | 1198.5 ms |
| Live | 2774 | 1371.9 ms | 1017.1 ms |
| Synthetic | 2840 | 1506.5 ms | 1863.0 ms |

All four cases passed the format checks and produced byte-identical output across both runs using plain Node v24.22.1.
