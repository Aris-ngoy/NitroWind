# nitro-wind benchmarks

Measure JS engine throughput as a lower bound for native C++ performance.

```bash
bun run --filter nitro-wind-benchmarks bench
```

The suite reports:

- Simple vs complex className resolution
- Cache hit throughput
- 1,000-row list style resolution

Native C++ results should be collected from the bare example app on iOS/Android (Nitro JSI). This JS suite is the Expo Go / fallback baseline and a regression check for parser performance.
