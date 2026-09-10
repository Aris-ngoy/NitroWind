# Theming

`NitroWindProvider` selects light or dark. Utility variants `dark:` and `light:` are resolved from that scheme (or the system appearance when no theme is passed).

```tsx
<NitroWindProvider theme="dark">
  <Box className="bg-white dark:bg-slate-950" />
</NitroWindProvider>
```

Call `setTheme("light" | "dark")` from `useNitroWind()` to switch at runtime. The native and JS engines both clear style caches when the theme name changes.
