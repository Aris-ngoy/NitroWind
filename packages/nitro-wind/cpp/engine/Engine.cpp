#include "Engine.hpp"
#include "Hash.hpp"
#include "Inflate.hpp"
#include "Parser.hpp"
#include "Theme.hpp"

namespace nitrowind::engine {

StyleResult Engine::compute(const std::string& className, const EngineContext& context) {
  const uint64_t key = cacheKey(className, contextBitmask(context), themeHash_);
  if (hasLast_ && key == lastKey_) {
    return lastResult_;
  }
  if (const auto* cached = cache_.get(key)) {
    hasLast_ = true;
    lastKey_ = key;
    lastResult_ = *cached;
    return lastResult_;
  }
  const auto parsed = parseResolved(className, context);
  StyleResult computed;
  computed.style = inflateStyle(parsed.style);
  computed.animation = parsed.animation;
  cache_.set(key, computed);
  hasLast_ = true;
  lastKey_ = key;
  lastResult_ = std::move(computed);
  return lastResult_;
}

std::vector<StyleResult> Engine::computeBatch(const std::vector<std::string>& classNames, const EngineContext& context) {
  std::vector<StyleResult> results;
  results.reserve(classNames.size());
  for (const auto& className : classNames) {
    results.push_back(compute(className, context));
  }
  return results;
}

void Engine::setThemeName(const std::string& name) {
  if (name == themeName_) return;
  themeName_ = name;
  themeHash_ = (name.empty() || name == "default") ? 0 : fnv1a64(name);
  hasLast_ = false;
  lastKey_ = 0;
  lastResult_ = {};
}

void Engine::registerThemeTokens(const std::string& payload) {
  ::nitrowind::engine::registerThemeTokens(payload);
  themeHash_ ^= fnv1a64(payload) | 1;
  clearCache();
}

void Engine::clearCache() {
  cache_.clear();
  hasLast_ = false;
  lastKey_ = 0;
  lastResult_ = {};
}

double Engine::getCacheSize() const {
  return static_cast<double>(cache_.size());
}

} // namespace nitrowind::engine
