#pragma once

#include "HybridNativeThemeTransitionSpec.hpp"
#include <optional>
#include <string>

namespace margelo::nitro::nitrowind {

class HybridNativeThemeTransition : public HybridNativeThemeTransitionSpec {
public:
  HybridNativeThemeTransition() : HybridObject(TAG) {}

  void prepareTransition(ThemeTransitionPreset preset, const std::string& targetTheme, std::optional<double> durationMs, const std::optional<TransitionOrigin>& origin) override {
    targetTheme_ = targetTheme;
    preset_ = preset;
  }

  void animateTransition(AppearanceOverride appearance, const std::function<void()>& preAnimationCallback) override {
    if (preAnimationCallback) {
      preAnimationCallback();
    }
  }

  void cancelTransition() override {
    targetTheme_.clear();
  }

  bool isAvailable() override {
    return false;
  }

private:
  std::string targetTheme_;
  ThemeTransitionPreset preset_{ThemeTransitionPreset::NONE};
};

} // namespace margelo::nitro::nitrowind
