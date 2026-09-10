# NitroWind

A high-performance Tailwind CSS engine for React Native. This glossary names the domain concepts behind the engine seam.

## Language

**StyleEngine**:
The module that turns a className string and a StyleContext into a StyleResult. Native C++ and the JS fallback are two adapters of the same interface.
_Avoid_: HybridObject, style service, resolver

**StyleResult**:
The ready-to-mount output of StyleEngine: an inflated React Native style dictionary (nested `transform` and `shadowOffset`) plus AnimationMeta. Callers never inflate or re-tokenize after crossing the engine seam.
_Avoid_: flat style map, ComputeResult

**StyleContext**:
The environmental and interaction state used to resolve variants: color scheme, platform, viewport, text direction, press/hover/focus, and group inheritance.
_Avoid_: theme bag, environment

**AnimationMeta**:
Resolved motion intent extracted from a className: animation name, duration, easing, and whether a transition is present.

**Variant**:
A conditional prefix on a utility token (`dark:`, `ios:`, `active:`, `md:`, `group-hover:`) evaluated against StyleContext.

**Tokenizer**:
The lexical scanner that splits a className into utility tokens, preserving bracketed arbitrary values and variant prefixes.

**ClassNameContextNeeds**:
Which slices of StyleContext a className actually reads (color scheme, platform, RTL, layout, interaction, group). Invariant classNames read none of them.
