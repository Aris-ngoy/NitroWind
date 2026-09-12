#pragma once

#include <cstddef>
#include <cstdint>
#include <functional>
#include <string>
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

constexpr uint64_t kGoldenRatio = 0x9E3779B97F4A7C15ull;
constexpr uint64_t kThemeMultiplier = 0x517CC1B727220A95ull;

inline uint64_t cacheKey(std::string_view className, uint32_t mask, uint64_t themeHash = 0) {
  uint64_t h = fnv1a64(className) ^ (static_cast<uint64_t>(mask) * kGoldenRatio);
  if (themeHash != 0) {
    h ^= (themeHash * kThemeMultiplier);
  }
  return h;
}

inline uint64_t cacheKey(std::string_view className, uint32_t mask, std::string_view theme) {
  if (theme.empty() || theme == "default") {
    return cacheKey(className, mask, static_cast<uint64_t>(0));
  }
  return cacheKey(className, mask, fnv1a64(theme));
}

struct TransparentStringHash {
  using is_transparent = void;

  std::size_t operator()(std::string_view value) const noexcept {
    return std::hash<std::string_view>{}(value);
  }

  std::size_t operator()(const std::string& value) const noexcept {
    return std::hash<std::string_view>{}(value);
  }

  std::size_t operator()(const char* value) const noexcept {
    return std::hash<std::string_view>{}(value);
  }
};

struct TransparentStringEqual {
  using is_transparent = void;

  bool operator()(std::string_view lhs, std::string_view rhs) const noexcept {
    return lhs == rhs;
  }
};

} // namespace nitrowind::engine
