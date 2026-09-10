#pragma once

#include <algorithm>
#include <cstdint>
#include <string>
#include <unordered_map>
#include <variant>
#include <vector>

namespace nitrowind::engine {

using StyleValue = std::variant<std::string, double>;
using StyleRecord = std::unordered_map<std::string, StyleValue>;

struct EngineContext {
  std::string colorScheme = "light";
  std::string platform = "ios";
  double width = 390;
  double height = 844;
  bool isRTL = false;
  bool pressed = false;
  bool hovered = false;
  bool focused = false;
  bool disabled = false;
  bool groupActive = false;
  bool groupFocus = false;
  bool groupHover = false;
};

struct ClassToken {
  std::string raw;
  std::vector<std::string> variants;
  std::string utility;
  bool important = false;
};

constexpr uint32_t BIT_DARK = 1u << 0;
constexpr uint32_t BIT_IOS = 1u << 1;
constexpr uint32_t BIT_ANDROID = 1u << 2;
constexpr uint32_t BIT_WEB = 1u << 3;
constexpr uint32_t BIT_RTL = 1u << 4;
constexpr uint32_t BIT_PRESSED = 1u << 5;
constexpr uint32_t BIT_HOVERED = 1u << 6;
constexpr uint32_t BIT_FOCUSED = 1u << 7;
constexpr uint32_t BIT_DISABLED = 1u << 8;
constexpr uint32_t BIT_GROUP_ACTIVE = 1u << 9;
constexpr uint32_t BIT_GROUP_FOCUS = 1u << 10;
constexpr uint32_t BIT_GROUP_HOVER = 1u << 11;

inline uint32_t contextBitmask(const EngineContext& context) {
  uint32_t bits = 0;
  if (context.colorScheme == "dark") bits |= BIT_DARK;
  if (context.platform == "ios") bits |= BIT_IOS;
  if (context.platform == "android") bits |= BIT_ANDROID;
  if (context.platform == "web") bits |= BIT_WEB;
  if (context.isRTL) bits |= BIT_RTL;
  if (context.pressed) bits |= BIT_PRESSED;
  if (context.hovered) bits |= BIT_HOVERED;
  if (context.focused) bits |= BIT_FOCUSED;
  if (context.disabled) bits |= BIT_DISABLED;
  if (context.groupActive) bits |= BIT_GROUP_ACTIVE;
  if (context.groupFocus) bits |= BIT_GROUP_FOCUS;
  if (context.groupHover) bits |= BIT_GROUP_HOVER;
  const uint32_t bucket = static_cast<uint32_t>(std::max(0.0, std::min(65535.0, context.width / 32.0)));
  return bits | (bucket << 16);
}

} // namespace nitrowind::engine
