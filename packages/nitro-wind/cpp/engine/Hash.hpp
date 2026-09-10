#pragma once

#include <cstdint>
#include <string_view>

namespace nitrowind::engine {

inline uint64_t fnv1a64(std::string_view input) {
  uint64_t hash = 14695981039346656037ull;
  for (unsigned char ch : input) {
    hash ^= static_cast<uint64_t>(ch);
    hash *= 1099511628211ull;
  }
  return hash;
}

} // namespace nitrowind::engine
