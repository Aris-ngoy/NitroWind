#pragma once

#include "ShadowTreeSynchronizer.hpp"
#include "NitroWindCommitHook.hpp"
#include <memory>

namespace nitrowind::fabric {

class NitroWindFabricRegistry {
public:
  static NitroWindFabricRegistry& shared() {
    static NitroWindFabricRegistry instance;
    return instance;
  }

  void initialize(std::shared_ptr<nitrowind::engine::Engine> engine) {
    engine_ = std::move(engine);
#if !NITRO_WIND_HAS_FABRIC
    commitHook_ = std::make_unique<NitroWindCommitHook>(engine_);
    commitHook_->registerHook();
#endif
  }

  void link(int32_t tag, const std::string& className, StyleDependency dependencies) {
    ShadowTreeSynchronizer::shared().linkNode(tag, className, dependencies);
  }

  void unlink(int32_t tag) {
    ShadowTreeSynchronizer::shared().unlinkNode(tag);
  }

  void notifyThemeChange(const std::string& newTheme) {
    if (engine_) {
      engine_->setThemeName(newTheme);
    }
    ShadowTreeSynchronizer::shared().markDirtyForDependencies(
        StyleDependency::Theme | StyleDependency::ColorScheme);
  }

  std::size_t getNodeCount() const {
    return ShadowTreeSynchronizer::shared().getNodeCount();
  }

  std::size_t getDirtyCount() const {
    return ShadowTreeSynchronizer::shared().getDirtyCount();
  }

  std::size_t flush(const nitrowind::engine::EngineContext& context) {
    if (!engine_) return 0;
    return ShadowTreeSynchronizer::shared().synchronize(*engine_, context);
  }

  void reset() {
    ShadowTreeSynchronizer::shared().clear();
  }

private:
  NitroWindFabricRegistry() = default;
  std::shared_ptr<nitrowind::engine::Engine> engine_;
#if !NITRO_WIND_HAS_FABRIC
  std::unique_ptr<NitroWindCommitHook> commitHook_;
#endif
};

} // namespace nitrowind::fabric
