#pragma once

#include "ShadowTreeSynchronizer.hpp"
#include "../engine/Engine.hpp"
#include <memory>
#include <atomic>

#if NITRO_WIND_HAS_FABRIC
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include <react/renderer/uimanager/UIManager.h>
#endif

namespace nitrowind::fabric {

#if NITRO_WIND_HAS_FABRIC
class NitroWindCommitHook : public facebook::react::UIManagerCommitHook {
public:
  explicit NitroWindCommitHook(
      std::shared_ptr<nitrowind::engine::Engine> engine,
      std::shared_ptr<facebook::react::UIManager> uiManager)
      : engine_(std::move(engine)), uiManager_(std::move(uiManager)) {
    if (uiManager_) {
      uiManager_->registerCommitHook(*this);
      isRegistered_ = true;
    }
  }

  ~NitroWindCommitHook() override {
    if (isRegistered_ && uiManager_) {
      uiManager_->unregisterCommitHook(*this);
    }
  }

  void commitHookWasRegistered(const facebook::react::UIManager& uiManager) noexcept override {
    isRegistered_ = true;
  }

  void commitHookWasUnregistered(const facebook::react::UIManager& uiManager) noexcept override {
    isRegistered_ = false;
  }

  facebook::react::RootShadowNode::Shared shadowTreeWillCommit(
      const facebook::react::ShadowTree& shadowTree,
      const facebook::react::RootShadowNode::Shared& oldRootShadowNode,
      const facebook::react::RootShadowNode::Shared& newRootShadowNode) noexcept override {
    if (!engine_ || ShadowTreeSynchronizer::shared().getDirtyCount() == 0) {
      return newRootShadowNode;
    }

    nitrowind::engine::EngineContext context;
    return ShadowTreeSynchronizer::shared().cloneShadowTree(newRootShadowNode, *engine_, context);
  }

  bool isRegistered() const noexcept {
    return isRegistered_;
  }

private:
  std::shared_ptr<nitrowind::engine::Engine> engine_;
  std::shared_ptr<facebook::react::UIManager> uiManager_;
  std::atomic<bool> isRegistered_{false};
};

#else

/**
 * Fallback / standalone implementation for testing and non-Fabric builds.
 */
class NitroWindCommitHook {
public:
  explicit NitroWindCommitHook(std::shared_ptr<nitrowind::engine::Engine> engine)
      : engine_(std::move(engine)) {}

  void registerHook() {
    isRegistered_ = true;
  }

  void unregisterHook() {
    isRegistered_ = false;
  }

  bool isRegistered() const noexcept {
    return isRegistered_;
  }

  std::size_t simulateCommit(const nitrowind::engine::EngineContext& context) {
    if (!engine_ || !isRegistered_) return 0;
    return ShadowTreeSynchronizer::shared().synchronize(*engine_, context);
  }

private:
  std::shared_ptr<nitrowind::engine::Engine> engine_;
  bool isRegistered_ = false;
};

#endif

} // namespace nitrowind::fabric
