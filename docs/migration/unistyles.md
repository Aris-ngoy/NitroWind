# Migrate from Unistyles

Unistyles is a StyleSheet DSL. NitroWind is a Tailwind `className` engine.

- Convert `StyleSheet.create` variants into utility strings (`p-4`, `bg-red-500`, `dark:bg-slate-900`).
- Use `useStyle` where you previously selected themes with Unistyles breakpoints (`md:`, `lg:`).
- Keep existing `style` props — `styled()` merges `className` with `style`.
