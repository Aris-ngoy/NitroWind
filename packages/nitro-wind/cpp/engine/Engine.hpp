#pragma once

#include "StyleCache.hpp"
#include "Types.hpp"
#include <cstdint>
#include <string>
#include <vector>

namespace nitrowind::engine {

class Engine {
public:
  StyleResult compute(const std::string& className, const EngineContext& context);
  std::vector<StyleResult> computeBatch(const std::vector<std::string>& classNames, const EngineContext& context);
  void setThemeName(const std::string& name);
  void clearCache();
  double getCacheSize() const;

private:
  StyleCache cache_;
  std::string themeName_ = "default";
  bool hasLast_ = false;
  uint64_t lastKey_ = 0;
  StyleResult lastResult_;
};

} // namespace nitrowind::engine
