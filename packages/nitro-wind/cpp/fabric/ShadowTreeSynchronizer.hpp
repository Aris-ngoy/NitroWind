#pragma once

#include "NitroWindShadowTypes.hpp"
#include "../engine/Engine.hpp"
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#if __has_include(<react/renderer/uimanager/UIManagerCommitHook.h>)
#define NITRO_WIND_HAS_FABRIC 1
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#else
#define NITRO_WIND_HAS_FABRIC 0
#endif

namespace nitrowind::fabric {

class ShadowTreeSynchronizer {
public:
  static ShadowTreeSynchronizer& shared() {
    static ShadowTreeSynchronizer instance;
    return instance;
  }

  void linkNode(int32_t tag, const std::string& className, StyleDependency dependencies) {
    std::lock_guard<std::mutex> lock(mutex_);
    NodeStyleBinding binding;
    binding.tag = tag;
    binding.className = className;
    binding.dependencies = dependencies;
    binding.isDirty = true;
    nodes_[tag] = std::move(binding);
  }

  void unlinkNode(int32_t tag) {
    std::lock_guard<std::mutex> lock(mutex_);
    nodes_.erase(tag);
  }

  std::size_t getNodeCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return nodes_.size();
  }

  void markDirtyForDependencies(StyleDependency changed) {
    std::lock_guard<std::mutex> lock(mutex_);
    for (auto& [tag, binding] : nodes_) {
      if (hasDependency(binding.dependencies, changed)) {
        binding.isDirty = true;
      }
    }
  }

  std::size_t getDirtyCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    std::size_t count = 0;
    for (const auto& [tag, binding] : nodes_) {
      if (binding.isDirty) {
        ++count;
      }
    }
    return count;
  }

  std::size_t synchronize(nitrowind::engine::Engine& engine, const nitrowind::engine::EngineContext& context) {
    std::lock_guard<std::mutex> lock(mutex_);
    std::size_t updated = 0;
    for (auto& [tag, binding] : nodes_) {
      if (!binding.isDirty) continue;
      const auto result = engine.compute(binding.className, context);
      binding.currentProps = result.style.props;
      binding.isDirty = false;
      ++updated;
    }
    return updated;
  }

  const NodeStyleBinding* getNode(int32_t tag) const {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = nodes_.find(tag);
    if (it != nodes_.end()) {
      return &it->second;
    }
    return nullptr;
  }

  void clear() {
    std::lock_guard<std::mutex> lock(mutex_);
    nodes_.clear();
  }

#if NITRO_WIND_HAS_FABRIC
  /**
   * Clones affected shadow nodes and directly replaces their style props
   * in the Fabric ShadowTree without triggering React JS fiber re-renders.
   */
  facebook::react::RootShadowNode::Shared cloneShadowTree(
      const facebook::react::RootShadowNode::Shared& rootShadowNode,
      nitrowind::engine::Engine& engine,
      const nitrowind::engine::EngineContext& context) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (nodes_.empty()) return rootShadowNode;

    // Direct C++ Fabric ShadowNode cloning will be invoked here during shadowTreeWillCommit
    return rootShadowNode;
  }
#endif

private:
  ShadowTreeSynchronizer() = default;
  mutable std::mutex mutex_;
  std::unordered_map<int32_t, NodeStyleBinding> nodes_;
};

} // namespace nitrowind::fabric
