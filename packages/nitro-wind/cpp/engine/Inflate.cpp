#include "Inflate.hpp"

namespace nitrowind::engine {
namespace {

double asNumber(const StyleValue& value) {
  return std::holds_alternative<double>(value) ? std::get<double>(value) : 0.0;
}

} // namespace

InflatedStyle inflateStyle(const StyleRecord& flat) {
  InflatedStyle inflated;
  std::optional<double> shadowOffsetWidth;
  std::optional<double> shadowOffsetHeight;
  std::optional<StyleValue> translateX;
  std::optional<StyleValue> translateY;
  std::optional<StyleValue> scale;
  std::optional<StyleValue> rotate;

  inflated.props.reserve(flat.size());
  for (const auto& [key, value] : flat) {
    if (key == "shadowOffsetWidth") {
      shadowOffsetWidth = asNumber(value);
      continue;
    }
    if (key == "shadowOffsetHeight") {
      shadowOffsetHeight = asNumber(value);
      continue;
    }
    if (key == "translateX") {
      translateX = value;
      continue;
    }
    if (key == "translateY") {
      translateY = value;
      continue;
    }
    if (key == "scale") {
      scale = value;
      continue;
    }
    if (key == "rotate") {
      rotate = value;
      continue;
    }
    inflated.props.emplace(key, value);
  }

  if (shadowOffsetWidth || shadowOffsetHeight) {
    inflated.shadowOffset = std::array<double, 2>{
        shadowOffsetWidth.value_or(0.0),
        shadowOffsetHeight.value_or(0.0),
    };
  }

  if (translateX) inflated.transform.emplace_back("translateX", *translateX);
  if (translateY) inflated.transform.emplace_back("translateY", *translateY);
  if (scale) inflated.transform.emplace_back("scale", *scale);
  if (rotate) inflated.transform.emplace_back("rotate", *rotate);

  return inflated;
}

} // namespace nitrowind::engine
