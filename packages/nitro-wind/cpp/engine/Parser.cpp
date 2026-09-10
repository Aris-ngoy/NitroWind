#include "Parser.hpp"
#include "Theme.hpp"
#include "Tokenizer.hpp"

#include <cctype>
#include <optional>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace nitrowind::engine {
namespace {

using PropList = std::vector<std::string>;

const std::unordered_map<std::string, PropList>& spacingProps() {
  static const std::unordered_map<std::string, PropList> props = {
      {"p", {"padding"}},
      {"px", {"paddingHorizontal"}},
      {"py", {"paddingVertical"}},
      {"pt", {"paddingTop"}},
      {"pb", {"paddingBottom"}},
      {"pl", {"paddingLeft"}},
      {"pr", {"paddingRight"}},
      {"ps", {"paddingStart"}},
      {"pe", {"paddingEnd"}},
      {"m", {"margin"}},
      {"mx", {"marginHorizontal"}},
      {"my", {"marginVertical"}},
      {"mt", {"marginTop"}},
      {"mb", {"marginBottom"}},
      {"ml", {"marginLeft"}},
      {"mr", {"marginRight"}},
      {"ms", {"marginStart"}},
      {"me", {"marginEnd"}},
      {"gap", {"gap"}},
      {"gap-x", {"columnGap"}},
      {"gap-y", {"rowGap"}},
      {"inset", {"top", "right", "bottom", "left"}},
      {"inset-x", {"left", "right"}},
      {"inset-y", {"top", "bottom"}},
      {"top", {"top"}},
      {"right", {"right"}},
      {"bottom", {"bottom"}},
      {"left", {"left"}},
      {"w", {"width"}},
      {"h", {"height"}},
      {"min-w", {"minWidth"}},
      {"min-h", {"minHeight"}},
      {"max-w", {"maxWidth"}},
      {"max-h", {"maxHeight"}},
      {"basis", {"flexBasis"}},
  };
  return props;
}

const std::unordered_map<std::string, std::string>& colorProps() {
  static const std::unordered_map<std::string, std::string> props = {
      {"bg", "backgroundColor"},
      {"text", "color"},
      {"border", "borderColor"},
      {"tint", "tintColor"},
      {"shadow", "shadowColor"},
  };
  return props;
}

const std::unordered_map<std::string, StyleRecord>& exactUtilities() {
  static const std::unordered_map<std::string, StyleRecord> exact = {
      {"flex", {{"display", "flex"}, {"flexDirection", "column"}}},
      {"hidden", {{"display", "none"}}},
      {"flex-1", {{"flex", 1.0}}},
      {"flex-row", {{"flexDirection", "row"}}},
      {"flex-row-reverse", {{"flexDirection", "row-reverse"}}},
      {"flex-col", {{"flexDirection", "column"}}},
      {"flex-col-reverse", {{"flexDirection", "column-reverse"}}},
      {"flex-wrap", {{"flexWrap", "wrap"}}},
      {"flex-nowrap", {{"flexWrap", "nowrap"}}},
      {"grow", {{"flexGrow", 1.0}}},
      {"grow-0", {{"flexGrow", 0.0}}},
      {"shrink", {{"flexShrink", 1.0}}},
      {"shrink-0", {{"flexShrink", 0.0}}},
      {"items-start", {{"alignItems", "flex-start"}}},
      {"items-end", {{"alignItems", "flex-end"}}},
      {"items-center", {{"alignItems", "center"}}},
      {"items-stretch", {{"alignItems", "stretch"}}},
      {"items-baseline", {{"alignItems", "baseline"}}},
      {"justify-start", {{"justifyContent", "flex-start"}}},
      {"justify-end", {{"justifyContent", "flex-end"}}},
      {"justify-center", {{"justifyContent", "center"}}},
      {"justify-between", {{"justifyContent", "space-between"}}},
      {"justify-around", {{"justifyContent", "space-around"}}},
      {"justify-evenly", {{"justifyContent", "space-evenly"}}},
      {"self-start", {{"alignSelf", "flex-start"}}},
      {"self-end", {{"alignSelf", "flex-end"}}},
      {"self-center", {{"alignSelf", "center"}}},
      {"self-stretch", {{"alignSelf", "stretch"}}},
      {"absolute", {{"position", "absolute"}}},
      {"relative", {{"position", "relative"}}},
      {"overflow-hidden", {{"overflow", "hidden"}}},
      {"overflow-visible", {{"overflow", "visible"}}},
      {"overflow-scroll", {{"overflow", "scroll"}}},
      {"italic", {{"fontStyle", "italic"}}},
      {"not-italic", {{"fontStyle", "normal"}}},
      {"underline", {{"textDecorationLine", "underline"}}},
      {"line-through", {{"textDecorationLine", "line-through"}}},
      {"no-underline", {{"textDecorationLine", "none"}}},
      {"uppercase", {{"textTransform", "uppercase"}}},
      {"lowercase", {{"textTransform", "lowercase"}}},
      {"capitalize", {{"textTransform", "capitalize"}}},
      {"text-left", {{"textAlign", "left"}}},
      {"text-center", {{"textAlign", "center"}}},
      {"text-right", {{"textAlign", "right"}}},
      {"text-justify", {{"textAlign", "justify"}}},
      {"border", {{"borderWidth", 1.0}}},
      {"border-0", {{"borderWidth", 0.0}}},
      {"border-2", {{"borderWidth", 2.0}}},
      {"border-4", {{"borderWidth", 4.0}}},
      {"border-8", {{"borderWidth", 8.0}}},
      {"border-solid", {{"borderStyle", "solid"}}},
      {"border-dashed", {{"borderStyle", "dashed"}}},
      {"border-dotted", {{"borderStyle", "dotted"}}},
      {"rounded", {{"borderRadius", 4.0}}},
      {"rounded-none", {{"borderRadius", 0.0}}},
      {"rounded-full", {{"borderRadius", 9999.0}}},
      {"w-full", {{"width", "100%"}}},
      {"h-full", {{"height", "100%"}}},
      {"w-auto", {{"width", "auto"}}},
      {"h-auto", {{"height", "auto"}}},
      {"aspect-square", {{"aspectRatio", 1.0}}},
      {"aspect-video", {{"aspectRatio", 16.0 / 9.0}}},
      {"shadow-sm", {{"shadowColor", "#000000"}, {"shadowOffsetWidth", 0.0}, {"shadowOffsetHeight", 1.0}, {"shadowOpacity", 0.1}, {"shadowRadius", 2.0}, {"elevation", 1.0}}},
      {"shadow", {{"shadowColor", "#000000"}, {"shadowOffsetWidth", 0.0}, {"shadowOffsetHeight", 2.0}, {"shadowOpacity", 0.15}, {"shadowRadius", 4.0}, {"elevation", 3.0}}},
      {"shadow-md", {{"shadowColor", "#000000"}, {"shadowOffsetWidth", 0.0}, {"shadowOffsetHeight", 4.0}, {"shadowOpacity", 0.18}, {"shadowRadius", 6.0}, {"elevation", 4.0}}},
      {"shadow-lg", {{"shadowColor", "#000000"}, {"shadowOffsetWidth", 0.0}, {"shadowOffsetHeight", 8.0}, {"shadowOpacity", 0.22}, {"shadowRadius", 10.0}, {"elevation", 8.0}}},
      {"shadow-none", {{"shadowOpacity", 0.0}, {"elevation", 0.0}}},
  };
  return exact;
}

bool startsWith(std::string_view value, std::string_view prefix) {
  return value.size() >= prefix.size() && value.substr(0, prefix.size()) == prefix;
}

std::optional<std::string> longestPrefix(std::string_view utility, const std::vector<std::string>& prefixes) {
  std::optional<std::string> best;
  for (const auto& prefix : prefixes) {
    if (utility == prefix || startsWith(utility, prefix + "-")) {
      if (!best || prefix.size() > best->size()) best = prefix;
    }
  }
  return best;
}

std::optional<StyleValue> parseArbitrary(std::string_view raw) {
  if (raw.size() < 2 || raw.front() != '[' || raw.back() != ']') return std::nullopt;
  std::string inner(raw.substr(1, raw.size() - 2));
  for (char& ch : inner) {
    if (ch == '_') ch = ' ';
  }
  if (inner.size() > 2 && inner.substr(inner.size() - 2) == "px") {
    return std::stod(inner.substr(0, inner.size() - 2));
  }
  if (!inner.empty() && inner.back() == '%') return inner;
  try {
    std::size_t idx = 0;
    const double n = std::stod(inner, &idx);
    if (idx == inner.size()) return n;
  } catch (...) {
  }
  return inner;
}

std::pair<std::string, std::optional<double>> splitOpacity(std::string_view utility) {
  const auto slash = utility.find_last_of('/');
  if (slash == std::string_view::npos || slash == 0) {
    return {std::string(utility), std::nullopt};
  }
  const auto suffix = std::string(utility.substr(slash + 1));
  const auto& opacities = opacityScale();
  auto it = opacities.find(suffix);
  if (it != opacities.end()) {
    return {std::string(utility.substr(0, slash)), it->second};
  }
  try {
    return {std::string(utility.substr(0, slash)), std::stod(suffix) / 100.0};
  } catch (...) {
    return {std::string(utility), std::nullopt};
  }
}

std::optional<StyleValue> spacingValue(std::string_view value) {
  if (value == "auto") return std::string("auto");
  if (value == "full") return std::string("100%");
  if (value == "1/2") return std::string("50%");
  if (value == "1/3") return std::string("33.333333%");
  if (value == "2/3") return std::string("66.666667%");
  if (value == "1/4") return std::string("25%");
  if (value == "3/4") return std::string("75%");
  const auto& scale = spacingScale();
  auto it = scale.find(std::string(value));
  if (it != scale.end()) return it->second;
  return parseArbitrary(value);
}

void assign(StyleRecord& target, const StyleRecord& patch) {
  for (const auto& [key, value] : patch) {
    target[key] = value;
  }
}

bool applyColor(StyleRecord& target, const std::string& prop, std::string_view token, std::optional<double> alpha) {
  auto color = resolveColor(token);
  if (!color) return false;
  target[prop] = alpha ? applyAlpha(*color, *alpha) : *color;
  return true;
}

} // namespace

bool variantMatches(std::string_view variant, const EngineContext& context) {
  if (variant == "dark") return context.colorScheme == "dark";
  if (variant == "light") return context.colorScheme == "light";
  if (variant == "ios") return context.platform == "ios";
  if (variant == "android") return context.platform == "android";
  if (variant == "web") return context.platform == "web";
  if (variant == "rtl") return context.isRTL;
  if (variant == "ltr") return !context.isRTL;
  if (variant == "active" || variant == "pressed") return context.pressed;
  if (variant == "hover") return context.hovered;
  if (variant == "focus") return context.focused;
  if (variant == "disabled") return context.disabled;
  if (variant == "group") return true;
  if (variant == "group-active" || variant == "group-pressed") return context.groupActive;
  if (variant == "group-focus") return context.groupFocus;
  if (variant == "group-hover") return context.groupHover;
  const auto& breakpoints = breakpointScale();
  auto it = breakpoints.find(std::string(variant));
  if (it != breakpoints.end()) return context.width >= it->second;
  return false;
}

std::optional<StyleRecord> resolveUtility(std::string_view utility) {
  if (utility.empty()) return std::nullopt;
  const auto [base, alpha] = splitOpacity(utility);

  const auto& exact = exactUtilities();
  auto exactIt = exact.find(base);
  if (exactIt != exact.end()) return exactIt->second;

  if (startsWith(base, "rounded-")) {
    const auto rest = base.substr(8);
    const auto& radii = radiusScale();
    auto it = radii.find(rest);
    if (it != radii.end()) return StyleRecord{{"borderRadius", it->second}};
  }

  if (startsWith(base, "text-")) {
    const auto rest = base.substr(5);
    const auto& sizes = fontSizeScale();
    auto sizeIt = sizes.find(rest);
    if (sizeIt != sizes.end()) return StyleRecord{{"fontSize", sizeIt->second}};
    StyleRecord out;
    if (applyColor(out, "color", rest, alpha)) return out;
    if (auto arbitrary = parseArbitrary(rest)) {
      if (std::holds_alternative<double>(*arbitrary)) return StyleRecord{{"fontSize", *arbitrary}};
      return StyleRecord{{"color", *arbitrary}};
    }
  }

  if (startsWith(base, "font-")) {
    const auto rest = base.substr(5);
    const auto& weights = fontWeightScale();
    auto it = weights.find(rest);
    if (it != weights.end()) return StyleRecord{{"fontWeight", it->second}};
  }

  if (startsWith(base, "opacity-")) {
    const auto rest = base.substr(8);
    const auto& opacities = opacityScale();
    auto it = opacities.find(rest);
    if (it != opacities.end()) return StyleRecord{{"opacity", it->second}};
  }

  if (startsWith(base, "z-")) {
    const auto rest = base.substr(2);
    const auto& z = zIndexScale();
    auto it = z.find(rest);
    if (it != z.end()) return StyleRecord{{"zIndex", it->second}};
  }

  if (startsWith(base, "border-")) {
    StyleRecord out;
    if (applyColor(out, "borderColor", base.substr(7), alpha)) return out;
  }

  std::vector<std::string> colorKeys;
  for (const auto& [key, _] : colorProps()) colorKeys.push_back(key);
  if (auto prefix = longestPrefix(base, colorKeys)) {
    const auto rest = base.substr(prefix->size() + 1);
    const auto prop = colorProps().at(*prefix);
    StyleRecord out;
    if (auto arbitrary = parseArbitrary(rest)) {
      if (std::holds_alternative<std::string>(*arbitrary)) {
        auto color = std::get<std::string>(*arbitrary);
        out[prop] = alpha ? applyAlpha(color, *alpha) : color;
        return out;
      }
    }
    if (applyColor(out, prop, rest, alpha)) return out;
  }

  std::vector<std::string> spacingKeys;
  for (const auto& [key, _] : spacingProps()) spacingKeys.push_back(key);
  if (auto prefix = longestPrefix(base, spacingKeys)) {
    const auto rest = base.substr(prefix->size() + 1);
    if (auto value = spacingValue(rest)) {
      StyleRecord out;
      for (const auto& prop : spacingProps().at(*prefix)) {
        out[prop] = *value;
      }
      return out;
    }
  }

  return std::nullopt;
}

StyleRecord parseClassName(std::string_view className, const EngineContext& context) {
  StyleRecord result;
  for (const auto& token : tokenize(className)) {
    bool matches = true;
    for (const auto& variant : token.variants) {
      if (!variantMatches(variant, context)) {
        matches = false;
        break;
      }
    }
    if (!matches) continue;
    if (auto patch = resolveUtility(token.utility)) {
      assign(result, *patch);
    }
  }
  return result;
}

} // namespace nitrowind::engine
