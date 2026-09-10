#pragma once

#include "Types.hpp"
#include <optional>
#include <string_view>

namespace nitrowind::engine {

bool variantMatches(std::string_view variant, const EngineContext& context);
std::optional<StyleRecord> resolveUtility(std::string_view utility);
StyleRecord parseClassName(std::string_view className, const EngineContext& context);

} // namespace nitrowind::engine
