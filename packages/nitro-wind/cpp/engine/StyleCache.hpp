#pragma once

#include "Types.hpp"
#include <cstddef>
#include <list>
#include <string>
#include <unordered_map>

namespace nitrowind::engine {

class StyleCache {
public:
  explicit StyleCache(std::size_t maxSize = 2048);

  const StyleRecord* get(const std::string& key);
  void set(const std::string& key, StyleRecord value);
  void clear();
  std::size_t size() const;

private:
  std::size_t maxSize_;
  std::list<std::pair<std::string, StyleRecord>> order_;
  std::unordered_map<std::string, std::list<std::pair<std::string, StyleRecord>>::iterator> index_;
};

} // namespace nitrowind::engine
