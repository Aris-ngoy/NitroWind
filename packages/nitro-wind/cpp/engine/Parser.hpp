#pragma once

#include "Types.hpp"
#include <string_view>

namespace nitrowind::engine {

struct ParsedClassName {
  StyleRecord style;
  AnimationMeta animation;
};

bool variantMatches(std::string_view variant, const EngineContext& context);
bool applyUtility(std::string_view utility, StyleRecord& target);
AnimationMeta parseAnimation(std::string_view className);
ParsedClassName parseResolved(std::string_view className, const EngineContext& context);
StyleRecord parseClassName(std::string_view className, const EngineContext& context);

} // namespace nitrowind::engine
