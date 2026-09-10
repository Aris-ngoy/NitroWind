#!/bin/bash
# Re-applies the ExpoModulesJSI fixes after `bun install` / `npm install`
# wipes node_modules.
#
# Upstream bugs (expo-modules-jsi 57.1.0, shipped with Expo SDK 57.0.21):
# 1. RuntimeScheduler.h annotates two C++ constructors with SWIFT_RETURNS_RETAINED.
#   Clang (Xcode 26.3+, Swift 6.2) rejects this:
#     "'RuntimeScheduler' cannot be annotated ... because it is not returning
#      a SWIFT_SHARED_REFERENCE type"
#   Constructors of a SWIFT_SHARED_REFERENCE type must NOT carry a
#   SWIFT_RETURNS_* annotation — only factory functions returning a pointer do.
#   See: HostFunctionClosure.h in the same package for the correct pattern
#   (bare ctor + `} SWIFT_IMMORTAL_REFERENCE;`).
# 2. JavaScriptRuntime.swift captures raw JSI pointers across `JavaScriptActor`
#   isolation via `nonisolated(unsafe)`, which still trips the `sending`
#   data-race diagnostic on Swift 6.2.4. The patch crosses the boundary as
#   `Int` addresses (`Sendable`) and rebuilds the pointers synchronously
#   inside, where they never outlive the call — sound and allocation-free.
#
# Idempotent: safe to run multiple times (uses --forward, skips if applied).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PATCHES=(
  "$ROOT/patches/expo-modules-jsi+57.1.0.patch"
  "$ROOT/patches/expo-modules-jsi+57.1.0-swift-concurrency.patch"
)
TARGETS=(
  "$ROOT/node_modules/expo-modules-jsi"
)

for pkg in "${TARGETS[@]}"; do
  if [[ ! -d "$pkg/apple/Sources/ExpoModulesJSI-Cxx/include" ]]; then
    echo "[fix-expo-jsi] skip (not installed): $pkg"
    continue
  fi
  for PATCH in "${PATCHES[@]}"; do
    if [[ ! -f "$PATCH" ]]; then
      echo "[fix-expo-jsi] patch file missing: $PATCH" >&2
      exit 1
    fi
    if patch --forward -p1 -d "$pkg" --dry-run < "$PATCH" >/dev/null 2>&1; then
      echo "[fix-expo-jsi] applying $(basename "$PATCH") to $pkg"
      patch -p1 -d "$pkg" < "$PATCH"
    else
      echo "[fix-expo-jsi] already applied: $(basename "$PATCH")"
    fi
  done
done
