#include "Engine.hpp"
#include "Hash.hpp"
#include "Parser.hpp"

#include <sstream>

namespace nitrowind::engine {

static std::string makeKey(const std::string& className, const EngineContext& context, const std::string& themeName) {
  const uint64_t hash = fnv1a64(className);
  std::ostringstream stream;
  stream << std::hex << hash << ':' << themeName << ':' << contextBitmask(context);
  return stream.str();
}

StyleRecord Engine::compute(const std::string& className, const EngineContext& context) {
  const auto key = makeKey(className, context, themeName_);
  if (const auto* cached = cache_.get(key)) {
    return *cached;
  }
  auto computed = parseClassName(className, context);
  cache_.set(key, computed);
  return computed;
}

std::vector<StyleRecord> Engine::computeBatch(const std::vector<std::string>& classNames, const EngineContext& context) {
  std::vector<StyleRecord> results;
  results.reserve(classNames.size());
  for (const auto& className : classNames) {
    results.push_back(compute(className, context));
  }
  return results;
}

void Engine::setThemeName(const std::string& name) {
  if (name == themeName_) return;
  themeName_ = name;
  cache_.clear();
}

void Engine::clearCache() {
  cache_.clear();
}

double Engine::getCacheSize() const {
  return static_cast<double>(cache_.size());
}

} // namespace nitrowind::engine
