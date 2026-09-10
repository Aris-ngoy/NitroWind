#pragma once

#include "HybridStyleEngineSpec.hpp"
#include "engine/Engine.hpp"
#include "engine/Types.hpp"
#include <cstdint>
#include <unordered_map>

namespace margelo::nitro::nitrowind {

class HybridStyleEngine : public HybridStyleEngineSpec {
public:
  HybridStyleEngine() : HybridObject(TAG) {}

  StyleResult compute(const std::string& className, const StyleContext& context) override;

  std::vector<StyleResult> computeBatch(
      const std::vector<std::string>& classNames,
      const StyleContext& context) override;

  void setThemeName(const std::string& name) override;
  void clearCache() override;
  double getCacheSize() override;

private:
  ::nitrowind::engine::Engine engine_;
  bool hasLast_ = false;
  uint64_t lastKey_ = 0;
  StyleResult lastResult_;
  std::unordered_map<uint64_t, StyleResult> nativeCache_;

  ::nitrowind::engine::EngineContext toEngineContext(const StyleContext& context) const;
  StyleResult toNativeResult(const ::nitrowind::engine::StyleResult& computed) const;
};

} // namespace margelo::nitro::nitrowind
