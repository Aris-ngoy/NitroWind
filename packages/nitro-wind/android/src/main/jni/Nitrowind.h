#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>

#include <memory>
#include <string>

inline std::shared_ptr<facebook::react::TurboModule> Nitrowind_ModuleProvider(
    const std::string& /*moduleName*/,
    const facebook::react::JavaTurboModule::InitParams& /*params*/) {
  return nullptr;
}
