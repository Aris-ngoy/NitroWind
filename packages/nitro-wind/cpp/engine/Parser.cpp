#include "Parser.hpp"
#include "Theme.hpp"
#include "Tokenizer.hpp"

#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <optional>
#include <string_view>
#include <utility>

namespace nitrowind::engine {
namespace {

struct PropWrite {
  const char* key;
  bool numeric;
  double number;
  const char* string;
};

struct ExactUtil {
  const PropWrite* props;
  std::uint8_t count;
};

struct ColorPrefix {
  std::string_view prefix;
  const char* prop;
};

struct SpacingPrefix {
  std::string_view prefix;
  const char* const* props;
  std::uint8_t count;
};

constexpr PropWrite kFlex[] = {{"display", false, 0, "flex"}, {"flexDirection", false, 0, "column"}};
constexpr PropWrite kHidden[] = {{"display", false, 0, "none"}};
constexpr PropWrite kFlex1[] = {{"flex", true, 1.0, nullptr}};
constexpr PropWrite kFlexRow[] = {{"flexDirection", false, 0, "row"}};
constexpr PropWrite kFlexRowReverse[] = {{"flexDirection", false, 0, "row-reverse"}};
constexpr PropWrite kFlexCol[] = {{"flexDirection", false, 0, "column"}};
constexpr PropWrite kFlexColReverse[] = {{"flexDirection", false, 0, "column-reverse"}};
constexpr PropWrite kFlexWrap[] = {{"flexWrap", false, 0, "wrap"}};
constexpr PropWrite kFlexNowrap[] = {{"flexWrap", false, 0, "nowrap"}};
constexpr PropWrite kGrow[] = {{"flexGrow", true, 1.0, nullptr}};
constexpr PropWrite kGrow0[] = {{"flexGrow", true, 0.0, nullptr}};
constexpr PropWrite kShrink[] = {{"flexShrink", true, 1.0, nullptr}};
constexpr PropWrite kShrink0[] = {{"flexShrink", true, 0.0, nullptr}};
constexpr PropWrite kItemsStart[] = {{"alignItems", false, 0, "flex-start"}};
constexpr PropWrite kItemsEnd[] = {{"alignItems", false, 0, "flex-end"}};
constexpr PropWrite kItemsCenter[] = {{"alignItems", false, 0, "center"}};
constexpr PropWrite kItemsStretch[] = {{"alignItems", false, 0, "stretch"}};
constexpr PropWrite kItemsBaseline[] = {{"alignItems", false, 0, "baseline"}};
constexpr PropWrite kJustifyStart[] = {{"justifyContent", false, 0, "flex-start"}};
constexpr PropWrite kJustifyEnd[] = {{"justifyContent", false, 0, "flex-end"}};
constexpr PropWrite kJustifyCenter[] = {{"justifyContent", false, 0, "center"}};
constexpr PropWrite kJustifyBetween[] = {{"justifyContent", false, 0, "space-between"}};
constexpr PropWrite kJustifyAround[] = {{"justifyContent", false, 0, "space-around"}};
constexpr PropWrite kJustifyEvenly[] = {{"justifyContent", false, 0, "space-evenly"}};
constexpr PropWrite kSelfStart[] = {{"alignSelf", false, 0, "flex-start"}};
constexpr PropWrite kSelfEnd[] = {{"alignSelf", false, 0, "flex-end"}};
constexpr PropWrite kSelfCenter[] = {{"alignSelf", false, 0, "center"}};
constexpr PropWrite kSelfStretch[] = {{"alignSelf", false, 0, "stretch"}};
constexpr PropWrite kAbsolute[] = {{"position", false, 0, "absolute"}};
constexpr PropWrite kRelative[] = {{"position", false, 0, "relative"}};
constexpr PropWrite kOverflowHidden[] = {{"overflow", false, 0, "hidden"}};
constexpr PropWrite kOverflowVisible[] = {{"overflow", false, 0, "visible"}};
constexpr PropWrite kOverflowScroll[] = {{"overflow", false, 0, "scroll"}};
constexpr PropWrite kItalic[] = {{"fontStyle", false, 0, "italic"}};
constexpr PropWrite kNotItalic[] = {{"fontStyle", false, 0, "normal"}};
constexpr PropWrite kUnderline[] = {{"textDecorationLine", false, 0, "underline"}};
constexpr PropWrite kLineThrough[] = {{"textDecorationLine", false, 0, "line-through"}};
constexpr PropWrite kNoUnderline[] = {{"textDecorationLine", false, 0, "none"}};
constexpr PropWrite kUppercase[] = {{"textTransform", false, 0, "uppercase"}};
constexpr PropWrite kLowercase[] = {{"textTransform", false, 0, "lowercase"}};
constexpr PropWrite kCapitalize[] = {{"textTransform", false, 0, "capitalize"}};
constexpr PropWrite kTextLeft[] = {{"textAlign", false, 0, "left"}};
constexpr PropWrite kTextCenter[] = {{"textAlign", false, 0, "center"}};
constexpr PropWrite kTextRight[] = {{"textAlign", false, 0, "right"}};
constexpr PropWrite kTextJustify[] = {{"textAlign", false, 0, "justify"}};
constexpr PropWrite kBorder[] = {{"borderWidth", true, 1.0, nullptr}};
constexpr PropWrite kBorder0[] = {{"borderWidth", true, 0.0, nullptr}};
constexpr PropWrite kBorder2[] = {{"borderWidth", true, 2.0, nullptr}};
constexpr PropWrite kBorder4[] = {{"borderWidth", true, 4.0, nullptr}};
constexpr PropWrite kBorder8[] = {{"borderWidth", true, 8.0, nullptr}};
constexpr PropWrite kBorderSolid[] = {{"borderStyle", false, 0, "solid"}};
constexpr PropWrite kBorderDashed[] = {{"borderStyle", false, 0, "dashed"}};
constexpr PropWrite kBorderDotted[] = {{"borderStyle", false, 0, "dotted"}};
constexpr PropWrite kRounded[] = {{"borderRadius", true, 4.0, nullptr}};
constexpr PropWrite kRoundedNone[] = {{"borderRadius", true, 0.0, nullptr}};
constexpr PropWrite kRoundedFull[] = {{"borderRadius", true, 9999.0, nullptr}};
constexpr PropWrite kWFull[] = {{"width", false, 0, "100%"}};
constexpr PropWrite kHFull[] = {{"height", false, 0, "100%"}};
constexpr PropWrite kWAuto[] = {{"width", false, 0, "auto"}};
constexpr PropWrite kHAuto[] = {{"height", false, 0, "auto"}};
constexpr PropWrite kAspectSquare[] = {{"aspectRatio", true, 1.0, nullptr}};
constexpr PropWrite kAspectVideo[] = {{"aspectRatio", true, 16.0 / 9.0, nullptr}};
constexpr PropWrite kShadowSm[] = {
    {"shadowColor", false, 0, "#000000"},
    {"shadowOffsetWidth", true, 0.0, nullptr},
    {"shadowOffsetHeight", true, 1.0, nullptr},
    {"shadowOpacity", true, 0.1, nullptr},
    {"shadowRadius", true, 2.0, nullptr},
    {"elevation", true, 1.0, nullptr},
};
constexpr PropWrite kShadow[] = {
    {"shadowColor", false, 0, "#000000"},
    {"shadowOffsetWidth", true, 0.0, nullptr},
    {"shadowOffsetHeight", true, 2.0, nullptr},
    {"shadowOpacity", true, 0.15, nullptr},
    {"shadowRadius", true, 4.0, nullptr},
    {"elevation", true, 3.0, nullptr},
};
constexpr PropWrite kShadowMd[] = {
    {"shadowColor", false, 0, "#000000"},
    {"shadowOffsetWidth", true, 0.0, nullptr},
    {"shadowOffsetHeight", true, 4.0, nullptr},
    {"shadowOpacity", true, 0.18, nullptr},
    {"shadowRadius", true, 6.0, nullptr},
    {"elevation", true, 4.0, nullptr},
};
constexpr PropWrite kShadowLg[] = {
    {"shadowColor", false, 0, "#000000"},
    {"shadowOffsetWidth", true, 0.0, nullptr},
    {"shadowOffsetHeight", true, 8.0, nullptr},
    {"shadowOpacity", true, 0.22, nullptr},
    {"shadowRadius", true, 10.0, nullptr},
    {"elevation", true, 8.0, nullptr},
};
constexpr PropWrite kShadowNone[] = {{"shadowOpacity", true, 0.0, nullptr}, {"elevation", true, 0.0, nullptr}};

#define EXACT(name, arr) \
  {                      \
    name, {              \
      arr, static_cast<std::uint8_t>(sizeof(arr) / sizeof(arr[0])) \
    }                    \
  }

const SvMap<ExactUtil>& exactUtilities() {
  static const SvMap<ExactUtil> exact = {
      EXACT("flex", kFlex),
      EXACT("hidden", kHidden),
      EXACT("flex-1", kFlex1),
      EXACT("flex-row", kFlexRow),
      EXACT("flex-row-reverse", kFlexRowReverse),
      EXACT("flex-col", kFlexCol),
      EXACT("flex-col-reverse", kFlexColReverse),
      EXACT("flex-wrap", kFlexWrap),
      EXACT("flex-nowrap", kFlexNowrap),
      EXACT("grow", kGrow),
      EXACT("grow-0", kGrow0),
      EXACT("shrink", kShrink),
      EXACT("shrink-0", kShrink0),
      EXACT("items-start", kItemsStart),
      EXACT("items-end", kItemsEnd),
      EXACT("items-center", kItemsCenter),
      EXACT("items-stretch", kItemsStretch),
      EXACT("items-baseline", kItemsBaseline),
      EXACT("justify-start", kJustifyStart),
      EXACT("justify-end", kJustifyEnd),
      EXACT("justify-center", kJustifyCenter),
      EXACT("justify-between", kJustifyBetween),
      EXACT("justify-around", kJustifyAround),
      EXACT("justify-evenly", kJustifyEvenly),
      EXACT("self-start", kSelfStart),
      EXACT("self-end", kSelfEnd),
      EXACT("self-center", kSelfCenter),
      EXACT("self-stretch", kSelfStretch),
      EXACT("absolute", kAbsolute),
      EXACT("relative", kRelative),
      EXACT("overflow-hidden", kOverflowHidden),
      EXACT("overflow-visible", kOverflowVisible),
      EXACT("overflow-scroll", kOverflowScroll),
      EXACT("italic", kItalic),
      EXACT("not-italic", kNotItalic),
      EXACT("underline", kUnderline),
      EXACT("line-through", kLineThrough),
      EXACT("no-underline", kNoUnderline),
      EXACT("uppercase", kUppercase),
      EXACT("lowercase", kLowercase),
      EXACT("capitalize", kCapitalize),
      EXACT("text-left", kTextLeft),
      EXACT("text-center", kTextCenter),
      EXACT("text-right", kTextRight),
      EXACT("text-justify", kTextJustify),
      EXACT("border", kBorder),
      EXACT("border-0", kBorder0),
      EXACT("border-2", kBorder2),
      EXACT("border-4", kBorder4),
      EXACT("border-8", kBorder8),
      EXACT("border-solid", kBorderSolid),
      EXACT("border-dashed", kBorderDashed),
      EXACT("border-dotted", kBorderDotted),
      EXACT("rounded", kRounded),
      EXACT("rounded-none", kRoundedNone),
      EXACT("rounded-full", kRoundedFull),
      EXACT("w-full", kWFull),
      EXACT("h-full", kHFull),
      EXACT("w-auto", kWAuto),
      EXACT("h-auto", kHAuto),
      EXACT("aspect-square", kAspectSquare),
      EXACT("aspect-video", kAspectVideo),
      EXACT("shadow-sm", kShadowSm),
      EXACT("shadow", kShadow),
      EXACT("shadow-md", kShadowMd),
      EXACT("shadow-lg", kShadowLg),
      EXACT("shadow-none", kShadowNone),
  };
  return exact;
}

#undef EXACT

constexpr ColorPrefix kColorPrefixes[] = {
    {"shadow", "shadowColor"},
    {"border", "borderColor"},
    {"text", "color"},
    {"tint", "tintColor"},
    {"bg", "backgroundColor"},
};

constexpr const char* kP[] = {"padding"};
constexpr const char* kPx[] = {"paddingHorizontal"};
constexpr const char* kPy[] = {"paddingVertical"};
constexpr const char* kPt[] = {"paddingTop"};
constexpr const char* kPb[] = {"paddingBottom"};
constexpr const char* kPl[] = {"paddingLeft"};
constexpr const char* kPr[] = {"paddingRight"};
constexpr const char* kPs[] = {"paddingStart"};
constexpr const char* kPe[] = {"paddingEnd"};
constexpr const char* kM[] = {"margin"};
constexpr const char* kMx[] = {"marginHorizontal"};
constexpr const char* kMy[] = {"marginVertical"};
constexpr const char* kMt[] = {"marginTop"};
constexpr const char* kMb[] = {"marginBottom"};
constexpr const char* kMl[] = {"marginLeft"};
constexpr const char* kMr[] = {"marginRight"};
constexpr const char* kMs[] = {"marginStart"};
constexpr const char* kMe[] = {"marginEnd"};
constexpr const char* kGap[] = {"gap"};
constexpr const char* kGapX[] = {"columnGap"};
constexpr const char* kGapY[] = {"rowGap"};
constexpr const char* kInset[] = {"top", "right", "bottom", "left"};
constexpr const char* kInsetX[] = {"left", "right"};
constexpr const char* kInsetY[] = {"top", "bottom"};
constexpr const char* kTop[] = {"top"};
constexpr const char* kRight[] = {"right"};
constexpr const char* kBottom[] = {"bottom"};
constexpr const char* kLeft[] = {"left"};
constexpr const char* kW[] = {"width"};
constexpr const char* kH[] = {"height"};
constexpr const char* kMinW[] = {"minWidth"};
constexpr const char* kMinH[] = {"minHeight"};
constexpr const char* kMaxW[] = {"maxWidth"};
constexpr const char* kMaxH[] = {"maxHeight"};
constexpr const char* kBasis[] = {"flexBasis"};

constexpr SpacingPrefix kSpacingP[] = {
    {"px", kPx, 1},
    {"py", kPy, 1},
    {"pt", kPt, 1},
    {"pb", kPb, 1},
    {"pl", kPl, 1},
    {"pr", kPr, 1},
    {"ps", kPs, 1},
    {"pe", kPe, 1},
    {"p", kP, 1},
};

constexpr SpacingPrefix kSpacingM[] = {
    {"mx", kMx, 1},
    {"my", kMy, 1},
    {"mt", kMt, 1},
    {"mb", kMb, 1},
    {"ml", kMl, 1},
    {"mr", kMr, 1},
    {"ms", kMs, 1},
    {"me", kMe, 1},
    {"min-w", kMinW, 1},
    {"min-h", kMinH, 1},
    {"max-w", kMaxW, 1},
    {"max-h", kMaxH, 1},
    {"m", kM, 1},
};

constexpr SpacingPrefix kSpacingW[] = {{"w", kW, 1}};
constexpr SpacingPrefix kSpacingH[] = {{"h", kH, 1}};
constexpr SpacingPrefix kSpacingG[] = {{"gap-x", kGapX, 1}, {"gap-y", kGapY, 1}, {"gap", kGap, 1}};
constexpr SpacingPrefix kSpacingI[] = {{"inset-x", kInsetX, 2}, {"inset-y", kInsetY, 2}, {"inset", kInset, 4}};
constexpr SpacingPrefix kSpacingT[] = {{"top", kTop, 1}};
constexpr SpacingPrefix kSpacingB[] = {{"bottom", kBottom, 1}, {"basis", kBasis, 1}};
constexpr SpacingPrefix kSpacingL[] = {{"left", kLeft, 1}};
constexpr SpacingPrefix kSpacingR[] = {{"right", kRight, 1}};

bool startsWith(std::string_view value, std::string_view prefix) {
  return value.size() >= prefix.size() && value.substr(0, prefix.size()) == prefix;
}

bool matchesPrefix(std::string_view utility, std::string_view prefix) {
  if (utility == prefix) return true;
  return utility.size() > prefix.size() && startsWith(utility, prefix) && utility[prefix.size()] == '-';
}

bool parseDouble(std::string_view value, double& out) {
  if (value.empty() || value.size() >= 63) return false;
  char buf[64];
  std::memcpy(buf, value.data(), value.size());
  buf[value.size()] = '\0';
  char* end = nullptr;
  out = std::strtod(buf, &end);
  return end == buf + value.size() && std::isfinite(out);
}

std::optional<StyleValue> parseArbitrary(std::string_view raw) {
  if (raw.size() < 2 || raw.front() != '[' || raw.back() != ']') return std::nullopt;
  const auto inner = raw.substr(1, raw.size() - 2);
  if (inner.size() > 2 && inner.substr(inner.size() - 2) == "px") {
    double n = 0;
    if (parseDouble(inner.substr(0, inner.size() - 2), n)) return n;
  }
  if (!inner.empty() && inner.back() == '%') return std::string(inner);
  double n = 0;
  if (parseDouble(inner, n)) return n;
  if (inner.find('_') == std::string_view::npos) return std::string(inner);
  std::string copied(inner);
  for (char& ch : copied) {
    if (ch == '_') ch = ' ';
  }
  return copied;
}

std::pair<std::string_view, std::optional<double>> splitOpacity(std::string_view utility) {
  const auto slash = utility.find_last_of('/');
  if (slash == std::string_view::npos || slash == 0) {
    return {utility, std::nullopt};
  }
  const auto suffix = utility.substr(slash + 1);
  const auto& opacities = opacityScale();
  auto it = opacities.find(suffix);
  if (it != opacities.end()) {
    return {utility.substr(0, slash), it->second};
  }
  double parsed = 0;
  if (parseDouble(suffix, parsed)) {
    return {utility.substr(0, slash), parsed / 100.0};
  }
  return {utility, std::nullopt};
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
  auto it = scale.find(value);
  if (it != scale.end()) return it->second;
  return parseArbitrary(value);
}

void setNumber(StyleRecord& target, const char* key, double value) {
  target[key] = value;
}

void setString(StyleRecord& target, const char* key, std::string_view value) {
  target[key] = std::string(value);
}

void applyExact(StyleRecord& target, const ExactUtil& exact) {
  for (std::uint8_t i = 0; i < exact.count; ++i) {
    const auto& prop = exact.props[i];
    if (prop.numeric) setNumber(target, prop.key, prop.number);
    else setString(target, prop.key, prop.string);
  }
}

bool applyColor(StyleRecord& target, const char* prop, std::string_view token, std::optional<double> alpha) {
  auto color = resolveColor(token);
  if (!color) return false;
  if (alpha) target[prop] = applyAlpha(*color, *alpha);
  else setString(target, prop, *color);
  return true;
}

void applyValue(StyleRecord& target, const char* key, const StyleValue& value) {
  target[key] = value;
}

template <std::size_t N>
bool trySpacingPrefixes(std::string_view base, const SpacingPrefix (&prefixes)[N], StyleRecord& target) {
  for (const auto& prefix : prefixes) {
    if (!matchesPrefix(base, prefix.prefix)) continue;
    const auto rest = base.substr(prefix.prefix.size() + 1);
    if (auto value = spacingValue(rest)) {
      for (std::uint8_t i = 0; i < prefix.count; ++i) {
        applyValue(target, prefix.props[i], *value);
      }
      return true;
    }
  }
  return false;
}

bool trySpacing(std::string_view base, StyleRecord& target) {
  if (base.empty()) return false;
  switch (base.front()) {
    case 'p':
      return trySpacingPrefixes(base, kSpacingP, target);
    case 'm':
      return trySpacingPrefixes(base, kSpacingM, target);
    case 'w':
      return trySpacingPrefixes(base, kSpacingW, target);
    case 'h':
      return trySpacingPrefixes(base, kSpacingH, target);
    case 'g':
      return trySpacingPrefixes(base, kSpacingG, target);
    case 'i':
      return trySpacingPrefixes(base, kSpacingI, target);
    case 't':
      return trySpacingPrefixes(base, kSpacingT, target);
    case 'b':
      return trySpacingPrefixes(base, kSpacingB, target);
    case 'l':
      return trySpacingPrefixes(base, kSpacingL, target);
    case 'r':
      return trySpacingPrefixes(base, kSpacingR, target);
    default:
      return false;
  }
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
  auto it = breakpoints.find(variant);
  if (it != breakpoints.end()) return context.width >= it->second;
  return false;
}

bool applyUtility(std::string_view utility, StyleRecord& target) {
  if (utility.empty()) return false;
  const auto [base, alpha] = splitOpacity(utility);

  const auto& exact = exactUtilities();
  auto exactIt = exact.find(base);
  if (exactIt != exact.end()) {
    applyExact(target, exactIt->second);
    return true;
  }

  if (startsWith(base, "rounded-")) {
    const auto rest = base.substr(8);
    const auto& radii = radiusScale();
    auto it = radii.find(rest);
    if (it != radii.end()) {
      setNumber(target, "borderRadius", it->second);
      return true;
    }
  }

  if (startsWith(base, "text-")) {
    const auto rest = base.substr(5);
    const auto& sizes = fontSizeScale();
    auto sizeIt = sizes.find(rest);
    if (sizeIt != sizes.end()) {
      setNumber(target, "fontSize", sizeIt->second);
      return true;
    }
    if (applyColor(target, "color", rest, alpha)) return true;
    if (auto arbitrary = parseArbitrary(rest)) {
      if (std::holds_alternative<double>(*arbitrary)) {
        setNumber(target, "fontSize", std::get<double>(*arbitrary));
        return true;
      }
      applyValue(target, "color", *arbitrary);
      return true;
    }
  }

  if (startsWith(base, "font-")) {
    const auto rest = base.substr(5);
    const auto& weights = fontWeightScale();
    auto it = weights.find(rest);
    if (it != weights.end()) {
      setString(target, "fontWeight", it->second);
      return true;
    }
  }

  if (startsWith(base, "opacity-")) {
    const auto rest = base.substr(8);
    const auto& opacities = opacityScale();
    auto it = opacities.find(rest);
    if (it != opacities.end()) {
      setNumber(target, "opacity", it->second);
      return true;
    }
  }

  if (startsWith(base, "z-")) {
    const auto rest = base.substr(2);
    const auto& z = zIndexScale();
    auto it = z.find(rest);
    if (it != z.end()) {
      setNumber(target, "zIndex", it->second);
      return true;
    }
  }

  if (startsWith(base, "border-")) {
    if (applyColor(target, "borderColor", base.substr(7), alpha)) return true;
  }

  for (const auto& prefix : kColorPrefixes) {
    if (!matchesPrefix(base, prefix.prefix)) continue;
    const auto rest = base.substr(prefix.prefix.size() + 1);
    if (auto arbitrary = parseArbitrary(rest)) {
      if (std::holds_alternative<std::string>(*arbitrary)) {
        auto color = std::get<std::string>(*arbitrary);
        target[prefix.prop] = alpha ? applyAlpha(color, *alpha) : std::move(color);
        return true;
      }
    }
    if (applyColor(target, prefix.prop, rest, alpha)) return true;
  }

  if (trySpacing(base, target)) return true;

  if (startsWith(base, "translate-x-") || startsWith(base, "translate-y-")) {
    const auto axis = startsWith(base, "translate-x-") ? "translateX" : "translateY";
    const auto rest = base.substr(12);
    if (auto value = spacingValue(rest)) {
      applyValue(target, axis, *value);
      return true;
    }
  }

  if (startsWith(base, "scale-")) {
    const auto rest = base.substr(6);
    double n = 0;
    if (parseDouble(rest, n)) {
      setNumber(target, "scale", n / 100.0);
      return true;
    }
  }

  if (startsWith(base, "rotate-")) {
    const auto rest = base.substr(7);
    double n = 0;
    if (parseDouble(rest, n)) {
      char buf[32];
      const int written = std::snprintf(buf, sizeof(buf), "%gdeg", n);
      if (written > 0) {
        setString(target, "rotate", std::string_view(buf, static_cast<std::size_t>(written)));
        return true;
      }
    }
  }

  return false;
}

StyleRecord parseClassName(std::string_view className, const EngineContext& context) {
  return parseResolved(className, context).style;
}

static void applyAnimationUtility(std::string_view utility, AnimationMeta& meta) {
  if (utility == "animate-none") meta.name = "none";
  else if (utility == "animate-spin") meta.name = "spin";
  else if (utility == "animate-ping") meta.name = "ping";
  else if (utility == "animate-pulse") meta.name = "pulse";
  else if (utility == "animate-bounce") meta.name = "bounce";
  else if (utility == "transition" || startsWith(utility, "transition-")) meta.transition = true;
  else if (startsWith(utility, "duration-")) {
    const auto rest = utility.substr(9);
    const auto& durations = durationScale();
    auto it = durations.find(rest);
    if (it != durations.end()) meta.durationMs = it->second;
  } else if (utility == "ease-linear") meta.easing = "linear";
  else if (utility == "ease-in") meta.easing = "ease-in";
  else if (utility == "ease-out") meta.easing = "ease-out";
  else if (utility == "ease-in-out") meta.easing = "ease-in-out";
}

ParsedClassName parseResolved(std::string_view className, const EngineContext& context) {
  ParsedClassName parsed;
  tokenize(className, [&](const ClassTokenView& token) {
    applyAnimationUtility(token.utility, parsed.animation);
    for (std::uint8_t i = 0; i < token.variantCount; ++i) {
      if (!variantMatches(token.variants[i], context)) return;
    }
    applyUtility(token.utility, parsed.style);
  });
  return parsed;
}

AnimationMeta parseAnimation(std::string_view className) {
  AnimationMeta meta;
  tokenize(className, [&](const ClassTokenView& token) {
    applyAnimationUtility(token.utility, meta);
  });
  return meta;
}

} // namespace nitrowind::engine
