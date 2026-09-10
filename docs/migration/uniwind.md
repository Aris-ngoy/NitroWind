# Migrate from Uniwind

Swap Uniwind's runtime for `nitro-wind`:

- Replace Uniwind providers with `NitroWindProvider`.
- Point `className` usage at `styled()` components from `nitro-wind`.
- Theme tokens follow Tailwind defaults (colors, spacing, radii). Custom Uniwind themes can be re-expressed with `dark:` variants or by extending `nitro-wind-core` token tables.
