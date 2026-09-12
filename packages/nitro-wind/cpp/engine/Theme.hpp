#pragma once

#include "Types.hpp"
#include <optional>
#include <string>
#include <string_view>

namespace nitrowind::engine {

const SvMap<double>& spacingScale();
const SvMap<double>& fontSizeScale();
const SvMap<std::string>& fontWeightScale();
const SvMap<double>& radiusScale();
const SvMap<double>& breakpointScale();
const SvMap<double>& opacityScale();
const SvMap<double>& zIndexScale();
const SvMap<double>& durationScale();

void resetThemeTokens();
void registerThemeTokens(std::string_view payload);

std::optional<std::string_view> resolveColor(std::string_view token);
std::optional<double> resolveSpacingToken(std::string_view token);
std::optional<double> resolveRadiusToken(std::string_view token);
std::optional<double> resolveFontSizeToken(std::string_view token);
std::optional<double> resolveBreakpointToken(std::string_view token);
std::string applyAlpha(std::string_view color, double alpha);

} // namespace nitrowind::engine
