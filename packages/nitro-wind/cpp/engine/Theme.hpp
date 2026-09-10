#pragma once

#include <optional>
#include <string>
#include <string_view>
#include <unordered_map>

namespace nitrowind::engine {

const std::unordered_map<std::string, double>& spacingScale();
const std::unordered_map<std::string, double>& fontSizeScale();
const std::unordered_map<std::string, std::string>& fontWeightScale();
const std::unordered_map<std::string, double>& radiusScale();
const std::unordered_map<std::string, double>& breakpointScale();
const std::unordered_map<std::string, double>& opacityScale();
const std::unordered_map<std::string, double>& zIndexScale();

std::optional<std::string> resolveColor(std::string_view token);
std::string applyAlpha(const std::string& color, double alpha);

} // namespace nitrowind::engine
