#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <unordered_map>
#include "../engine/Types.hpp"

namespace nitrowind::fabric {

enum class StyleDependency : uint16_t {
  None = 0,
  ColorScheme = 1 << 0,
  Theme = 1 << 1,
  Dimensions = 1 << 2,
  Orientation = 1 << 3,
  Insets = 1 << 4,
  RTL = 1 << 5,
  Variables = 1 << 6,
};

inline StyleDependency operator|(StyleDependency a, StyleDependency b) {
  return static_cast<StyleDependency>(static_cast<uint16_t>(a) | static_cast<uint16_t>(b));
}

inline StyleDependency operator&(StyleDependency a, StyleDependency b) {
  return static_cast<StyleDependency>(static_cast<uint16_t>(a) & static_cast<uint16_t>(b));
}

inline bool hasDependency(StyleDependency mask, StyleDependency target) {
  return (static_cast<uint16_t>(mask) & static_cast<uint16_t>(target)) != 0;
}

struct NodeStyleBinding {
  int32_t tag = 0;
  std::string className;
  StyleDependency dependencies = StyleDependency::None;
  nitrowind::engine::StyleRecord currentProps;
  bool isDirty = false;
};

} // namespace nitrowind::fabric
