#include "HybridStyleEngine.hpp"

namespace margelo::nitro::nitrowind {

nitrowind::engine::EngineContext HybridStyleEngine::toEngineContext(const StyleContext& context) const {
  nitrowind::engine::EngineContext engineContext;
  engineContext.colorScheme = context.colorScheme;
  engineContext.platform = context.platform;
  engineContext.width = context.width;
  engineContext.height = context.height;
  engineContext.isRTL = context.isRTL;
  engineContext.pressed = context.pressed;
  engineContext.hovered = context.hovered;
  engineContext.focused = context.focused;
  engineContext.disabled = context.disabled;
  engineContext.groupActive = context.groupActive;
  engineContext.groupFocus = context.groupFocus;
  engineContext.groupHover = context.groupHover;
  return engineContext;
}

std::unordered_map<std::string, std::variant<std::string, double>> HybridStyleEngine::compute(
    const std::string& className,
    const StyleContext& context) {
  return engine_.compute(className, toEngineContext(context));
}

std::vector<std::unordered_map<std::string, std::variant<std::string, double>>> HybridStyleEngine::computeBatch(
    const std::vector<std::string>& classNames,
    const StyleContext& context) {
  return engine_.computeBatch(classNames, toEngineContext(context));
}

void HybridStyleEngine::setThemeName(const std::string& name) {
  engine_.setThemeName(name);
}

void HybridStyleEngine::clearCache() {
  engine_.clearCache();
}

double HybridStyleEngine::getCacheSize() {
  return engine_.getCacheSize();
}

} // namespace margelo::nitro::nitrowind
