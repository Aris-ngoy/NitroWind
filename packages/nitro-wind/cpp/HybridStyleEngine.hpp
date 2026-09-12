#pragma once

#include "HybridStyleEngineSpec.hpp"
#include "engine/Engine.hpp"
#include "engine/Types.hpp"

namespace margelo::nitro::nitrowind {

// A thin JSI adapter: marshal in, delegate to engine_, marshal out. It holds
// no cache and no last-call memo of its own. engine_ (nitrowind::engine::Engine)
// already caches by (className, contextBitmask) and memoizes the last call —
// a cache here on top of that would key on the exact same (className, context)
// pair and be cleared by the exact same setThemeName/clearCache calls, so it
// could only ever re-answer a question engine_ had already answered. In
// nitro-wind's actual call pattern it could not even do that: the JS-side
// engine.ts cache in packages/nitro-wind/src/engine.ts is consulted first and
// only calls into this class on its own miss, so by the time compute() runs
// here the (className, context) pair is one the JS cache has never seen —
// this class would see it exactly once too. A cache that structurally never
// gets a second lookup for the same key never has a hit to serve; it only
// pays a hash, a lookup, and an insert on every call. See toNativeResult:
// removing it also stopped double-allocating a fresh AnyMap on a memo hit
// that couldn't happen.
class HybridStyleEngine : public HybridStyleEngineSpec {
public:
  HybridStyleEngine() : HybridObject(TAG) {}

  StyleResult compute(const std::string& className, const StyleContext& context) override;

  std::vector<StyleResult> computeBatch(
      const std::vector<std::string>& classNames,
      const StyleContext& context) override;

  void setThemeName(const std::string& name) override;
  void registerThemeTokens(const std::string& payload) override;
  void clearCache() override;
  double getCacheSize() override;

private:
  ::nitrowind::engine::Engine engine_;

  ::nitrowind::engine::EngineContext toEngineContext(const StyleContext& context) const;
  StyleResult toNativeResult(const ::nitrowind::engine::StyleResult& computed) const;
};

} // namespace margelo::nitro::nitrowind
