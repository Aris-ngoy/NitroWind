#include "HybridStyleEngine.hpp"

#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::nitrowind {
namespace {

using margelo::nitro::AnyArray;
using margelo::nitro::AnyMap;
using margelo::nitro::AnyObject;
using margelo::nitro::AnyValue;

AnyValue toAnyValue(const ::nitrowind::engine::StyleValue& value) {
  if (std::holds_alternative<std::string>(value)) {
    return std::get<std::string>(value);
  }
  return std::get<double>(value);
}

std::shared_ptr<AnyMap> toAnyMap(const ::nitrowind::engine::InflatedStyle& style) {
  auto map = AnyMap::make(
      style.props.size() + (style.shadowOffset ? 1 : 0) + (style.transform.empty() ? 0 : 1));
  for (const auto& [key, value] : style.props) {
    if (std::holds_alternative<std::string>(value)) {
      map->setString(key, std::get<std::string>(value));
    } else {
      map->setDouble(key, std::get<double>(value));
    }
  }
  if (style.shadowOffset) {
    AnyObject offset;
    offset.emplace("width", (*style.shadowOffset)[0]);
    offset.emplace("height", (*style.shadowOffset)[1]);
    map->setObject("shadowOffset", std::move(offset));
  }
  if (!style.transform.empty()) {
    AnyArray transforms;
    transforms.reserve(style.transform.size());
    for (const auto& [prop, value] : style.transform) {
      AnyObject entry;
      entry.emplace(prop, toAnyValue(value));
      transforms.emplace_back(std::move(entry));
    }
    map->setArray("transform", std::move(transforms));
  }
  return map;
}

} // namespace

::nitrowind::engine::EngineContext HybridStyleEngine::toEngineContext(const StyleContext& context) const {
  ::nitrowind::engine::EngineContext engineContext;
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

StyleResult HybridStyleEngine::toNativeResult(const ::nitrowind::engine::StyleResult& computed) const {
  const auto& animation = computed.animation;
  return StyleResult(
      toAnyMap(computed.style),
      AnimationMeta(animation.name, animation.durationMs, animation.easing, animation.transition));
}

StyleResult HybridStyleEngine::compute(const std::string& className, const StyleContext& context) {
  return toNativeResult(engine_.compute(className, toEngineContext(context)));
}

std::vector<StyleResult> HybridStyleEngine::computeBatch(
    const std::vector<std::string>& classNames,
    const StyleContext& context) {
  std::vector<StyleResult> results;
  results.reserve(classNames.size());
  for (const auto& item : classNames) {
    results.push_back(compute(item, context));
  }
  return results;
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
