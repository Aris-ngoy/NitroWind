# Migrate from NativeWind

1. Install `nitro-wind` and `react-native-nitro-modules`.
2. Replace `NativeWindProvider` with `NitroWindProvider`.
3. Keep using `className` on `styled()` components or enable the Babel automapping plugin:

```js
plugins: ["nitro-wind/babel"]
```

4. Most Tailwind layout, spacing, color, and typography utilities work unchanged.
5. NativeWind-specific `cssInterop` calls are unnecessary — `styled()` maps `className` onto the `style` prop.
