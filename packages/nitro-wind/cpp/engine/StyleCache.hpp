#pragma once

#include "Types.hpp"
#include <cstddef>
#include <cstdint>
#include <list>
#include <unordered_map>

namespace nitrowind::engine {

class StyleCache {
public:
  explicit StyleCache(std::size_t maxSize = 2048);

  const StyleResult* get(uint64_t key);
  void set(uint64_t key, StyleResult value);
  void clear();
  std::size_t size() const;

private:
  std::size_t maxSize_;
  std::list<std::pair<uint64_t, StyleResult>> order_;
  std::unordered_map<uint64_t, std::list<std::pair<uint64_t, StyleResult>>::iterator> index_;
};

} // namespace nitrowind::engine
