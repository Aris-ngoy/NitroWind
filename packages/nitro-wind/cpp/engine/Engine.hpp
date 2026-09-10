#pragma once

#include "StyleCache.hpp"
#include "Types.hpp"
#include <string>
#include <vector>

namespace nitrowind::engine {

class Engine {
public:
  StyleRecord compute(const std::string& className, const EngineContext& context);
  std::vector<StyleRecord> computeBatch(const std::vector<std::string>& classNames, const EngineContext& context);
  void setThemeName(const std::string& name);
  void clearCache();
  double getCacheSize() const;

private:
  StyleCache cache_;
  std::string themeName_ = "default";
};

} // namespace nitrowind::engine
