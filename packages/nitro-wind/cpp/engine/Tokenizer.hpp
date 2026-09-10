#pragma once

#include "Types.hpp"
#include <string_view>
#include <vector>

namespace nitrowind::engine {

ClassToken parseClassToken(std::string_view raw);
std::vector<ClassToken> tokenize(std::string_view className);

} // namespace nitrowind::engine
