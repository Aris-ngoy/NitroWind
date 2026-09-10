#include "StyleCache.hpp"

namespace nitrowind::engine {

StyleCache::StyleCache(std::size_t maxSize) : maxSize_(maxSize) {}

const StyleResult* StyleCache::get(uint64_t key) {
  auto it = index_.find(key);
  if (it == index_.end()) return nullptr;
  order_.splice(order_.begin(), order_, it->second);
  it->second = order_.begin();
  return &it->second->second;
}

void StyleCache::set(uint64_t key, StyleResult value) {
  auto it = index_.find(key);
  if (it != index_.end()) {
    order_.erase(it->second);
    index_.erase(it);
  }
  order_.emplace_front(key, std::move(value));
  index_[key] = order_.begin();
  if (order_.size() > maxSize_) {
    index_.erase(order_.back().first);
    order_.pop_back();
  }
}

void StyleCache::clear() {
  order_.clear();
  index_.clear();
}

std::size_t StyleCache::size() const {
  return index_.size();
}

} // namespace nitrowind::engine
