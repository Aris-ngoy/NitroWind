#pragma once

#include "HybridStyleEngineSpec.hpp"
#include "engine/Engine.hpp"
#include "engine/Types.hpp"

namespace margelo::nitro::nitrowind {

class HybridStyleEngine : public HybridStyleEngineSpec {
public:
  HybridStyleEngine() : HybridObject(TAG) {}

  std::unordered_map<std::string, std::variant<std::string, double>> compute(
      const std::string& className,
      const StyleContext& context) override;

  std::vector<std::unordered_map<std::string, std::variant<std::string, double>>> computeBatch(
      const std::vector<std::string>& classNames,
      const StyleContext& context) override;

  void setThemeName(const std::string& name) override;
  void clearCache() override;
  double getCacheSize() override;

private:
  nitrowind::engine::Engine engine_;
  nitrowind::engine::EngineContext toEngineContext(const StyleContext& context) const;
};

} // namespace margelo::nitro::nitrowind
