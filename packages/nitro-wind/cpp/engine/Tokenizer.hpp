#pragma once

#include "Types.hpp"
#include <cctype>
#include <string_view>

namespace nitrowind::engine {

ClassTokenView parseClassToken(std::string_view raw);

template <typename Fn>
void tokenize(std::string_view className, Fn&& fn) {
  std::size_t start = 0;
  while (start < className.size()) {
    while (start < className.size() && std::isspace(static_cast<unsigned char>(className[start]))) {
      ++start;
    }
    if (start >= className.size()) break;
    std::size_t end = start;
    while (end < className.size() && !std::isspace(static_cast<unsigned char>(className[end]))) {
      ++end;
    }
    fn(parseClassToken(className.substr(start, end - start)));
    start = end;
  }
}

} // namespace nitrowind::engine
