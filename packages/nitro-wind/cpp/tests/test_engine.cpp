#include "engine/Engine.hpp"
#include "engine/Hash.hpp"
#include "engine/Parser.hpp"
#include "engine/Theme.hpp"
#include "engine/Tokenizer.hpp"
#include "fabric/NitroWindFabricRegistry.hpp"

#include <iostream>
#include <stdexcept>
#include <string>
#include <variant>

using namespace nitrowind::engine;

static int failures = 0;

template <typename T>
void expectEqual(const T& actual, const T& expected, const std::string& message) {
  if (actual != expected) {
    std::cerr << "FAIL: " << message << "\n";
    ++failures;
  } else {
    std::cout << "PASS: " << message << "\n";
  }
}

static double asNumber(const StyleRecord& record, const std::string& key) {
  auto it = record.find(key);
  if (it == record.end() || !std::holds_alternative<double>(it->second)) {
    throw std::runtime_error("missing number " + key);
  }
  return std::get<double>(it->second);
}

static std::string asString(const StyleRecord& record, const std::string& key) {
  auto it = record.find(key);
  if (it == record.end() || !std::holds_alternative<std::string>(it->second)) {
    throw std::runtime_error("missing string " + key);
  }
  return std::get<std::string>(it->second);
}

static double asNumber(const StyleResult& result, const std::string& key) {
  return asNumber(result.style.props, key);
}

static std::string asString(const StyleResult& result, const std::string& key) {
  return asString(result.style.props, key);
}

// Generated from packages/nitro-wind-core/src/__tests__/parity.fixtures.ts —
// the same fixtures parity.test.ts runs against the JS engine. Included here
// (after expectEqual/asNumber/asString are defined above) rather than linked
// as a separate translation unit, matching this file's existing style.
#include "fixtures.generated.hpp"

int main() {
  expectEqual(
      fnv1a64(""),
      static_cast<uint64_t>(14695981039346656037ull),
      "fnv1a64 empty string is the offset basis");

  EngineContext context;

  std::size_t tokenCount = 0;
  std::string firstUtility;
  std::uint8_t firstVariantCount = 0;
  tokenize("dark:ios:p-4 bg-red-500", [&](const ClassTokenView& token) {
    if (tokenCount == 0) {
      firstUtility = std::string(token.utility);
      firstVariantCount = token.variantCount;
    }
    ++tokenCount;
  });
  expectEqual(tokenCount, static_cast<std::size_t>(2), "tokenize splits class names");
  expectEqual(firstUtility, std::string("p-4"), "first utility is p-4");
  expectEqual(static_cast<std::size_t>(firstVariantCount), static_cast<std::size_t>(2), "stacked variants parsed");

  Engine engine;
  const auto style = engine.compute("p-4 bg-red-500", context);
  expectEqual(asNumber(style, "padding"), 16.0, "p-4 -> padding 16");
  expectEqual(asString(style, "backgroundColor"), std::string("#ef4444"), "bg-red-500 -> #ef4444");
  expectEqual(style.animation.name.has_value(), false, "static className has no animation name");
  expectEqual(style.animation.transition, false, "static className has no transition");

  EngineContext darkIos = context;
  darkIos.colorScheme = "dark";
  darkIos.platform = "ios";
  const auto themed = parseClassName("p-2 dark:bg-black ios:p-6", darkIos);
  expectEqual(asNumber(themed, "padding"), 24.0, "ios:p-6 overrides p-2");
  expectEqual(asString(themed, "backgroundColor"), std::string("#000000"), "dark:bg-black applied");

  EngineContext grouped = context;
  grouped.groupActive = true;
  const auto groupStyle = parseClassName("text-white group-active:text-red-500", grouped);
  expectEqual(asString(groupStyle, "color"), std::string("#ef4444"), "group-active variant");

  const auto shadow = engine.compute("shadow-md", context);
  expectEqual(shadow.style.shadowOffset.has_value(), true, "shadow-md inflates shadowOffset");
  expectEqual((*shadow.style.shadowOffset)[0], 0.0, "shadowOffset.width is 0");
  expectEqual((*shadow.style.shadowOffset)[1], 4.0, "shadowOffset.height is 4");
  expectEqual(asNumber(shadow, "elevation"), 4.0, "shadow-md elevation 4");

  const auto moved = engine.compute("translate-x-4 scale-110", context);
  expectEqual(moved.style.transform.size(), static_cast<std::size_t>(2), "transform inflates translate and scale");
  expectEqual(moved.style.transform[0].first, std::string("translateX"), "first transform is translateX");
  expectEqual(std::get<double>(moved.style.transform[0].second), 16.0, "translate-x-4 -> 16");
  expectEqual(std::get<double>(moved.style.transform[1].second), 1.1, "scale-110 -> 1.1");

  const auto animated = engine.compute("transition-all duration-300 ease-in-out animate-spin", context);
  expectEqual(animated.animation.name.has_value(), true, "animate-spin sets name");
  expectEqual(*animated.animation.name, std::string("spin"), "animation name is spin");
  expectEqual(animated.animation.durationMs, 300.0, "duration-300");
  expectEqual(animated.animation.easing, std::string("ease-in-out"), "ease-in-out");
  expectEqual(animated.animation.transition, true, "transition-all sets transition");

  Engine cacheEngine;
  cacheEngine.compute("flex-1 items-center", context);
  cacheEngine.compute("flex-1 items-center", context);
  expectEqual(cacheEngine.getCacheSize(), 1.0, "cache stores unique class names");

  Engine schemeEngine;
  schemeEngine.compute("bg-white dark:bg-black", context);
  EngineContext darkCtx = context;
  darkCtx.colorScheme = "dark";
  schemeEngine.compute("bg-white dark:bg-black", darkCtx);
  expectEqual(schemeEngine.getCacheSize(), 2.0, "different bitmasks are distinct keys");

  Engine multiThemeEngine;
  multiThemeEngine.compute("bg-white", context);
  expectEqual(multiThemeEngine.getCacheSize(), 1.0, "theme engine has 1 entry");
  multiThemeEngine.setThemeName("ocean");
  multiThemeEngine.compute("bg-white", context);
  expectEqual(multiThemeEngine.getCacheSize(), 2.0, "theme engine retains previous theme cache entries across theme switch");
  multiThemeEngine.setThemeName("default");
  multiThemeEngine.compute("bg-white", context);
  expectEqual(multiThemeEngine.getCacheSize(), 2.0, "returning to default theme hits cache without re-allocating");

  StyleRecord patched;
  applyUtility("p-2", patched);
  applyUtility("p-4", patched);
  applyUtility("bg-red-500/50", patched);
  expectEqual(asNumber(patched, "padding"), 16.0, "applyUtility writes in place and overrides");
  expectEqual(asString(patched, "backgroundColor"), std::string("rgba(239,68,68,0.5)"), "opacity modifier uses stack-formatted rgba");

  const auto arbitrary = parseClassName("p-[20] bg-[#ff0055] w-[50%]", context);
  expectEqual(asNumber(arbitrary, "padding"), 20.0, "arbitrary px-less number");
  expectEqual(asString(arbitrary, "backgroundColor"), std::string("#ff0055"), "arbitrary hex color");
  expectEqual(asString(arbitrary, "width"), std::string("50%"), "arbitrary percent");

  Engine parityEngine;
  runParityFixtures(parityEngine);

  // Fabric ShadowTree Synchronizer & Commit Hook Prototype Tests
  auto sharedEngine = std::make_shared<Engine>();
  auto& registry = nitrowind::fabric::NitroWindFabricRegistry::shared();
  registry.initialize(sharedEngine);
  registry.reset();

  using nitrowind::fabric::StyleDependency;
  registry.link(101, "bg-white dark:bg-black", StyleDependency::ColorScheme);
  registry.link(102, "p-4", StyleDependency::None);
  registry.link(103, "bg-ocean-500", StyleDependency::Theme);

  expectEqual(registry.getNodeCount(), static_cast<std::size_t>(3), "registered 3 shadow nodes");
  expectEqual(registry.getDirtyCount(), static_cast<std::size_t>(3), "nodes start dirty upon link");

  // Initial flush
  auto flushed = registry.flush(context);
  expectEqual(flushed, static_cast<std::size_t>(3), "initial flush updates all 3 nodes");
  expectEqual(registry.getDirtyCount(), static_cast<std::size_t>(0), "after flush, dirty count is 0");

  // Notify theme change: only nodes with Theme/ColorScheme dependencies become dirty
  registry.notifyThemeChange("dark");
  expectEqual(registry.getDirtyCount(), static_cast<std::size_t>(2), "only Theme/ColorScheme dependent nodes become dirty");

  EngineContext darkContext = context;
  darkContext.colorScheme = "dark";
  flushed = registry.flush(darkContext);
  expectEqual(flushed, static_cast<std::size_t>(2), "flush updates only the 2 dirty nodes");
  expectEqual(registry.getDirtyCount(), static_cast<std::size_t>(0), "all nodes clean after theme commit");

  resetThemeTokens();
  Engine customTheme;
  customTheme.registerThemeTokens("RESET\nC\tbrand-500\t#4F46E5\nS\t18\t72\nR\t4xl\t32\nF\txxs\t10\nB\txs\t400\n");
  const auto custom = customTheme.compute("bg-brand-500 p-18 rounded-4xl text-xxs", context);
  expectEqual(asString(custom, "backgroundColor"), std::string("#4F46E5"), "tailwind.config color");
  expectEqual(asNumber(custom, "padding"), 72.0, "tailwind.config spacing");
  expectEqual(asNumber(custom, "borderRadius"), 32.0, "tailwind.config radius");
  expectEqual(asNumber(custom, "fontSize"), 10.0, "tailwind.config fontSize");
  EngineContext xsContext = context;
  xsContext.width = 420;
  const auto xs = customTheme.compute("xs:p-4", xsContext);
  expectEqual(asNumber(xs, "padding"), 16.0, "tailwind.config screen");
  resetThemeTokens();

  // Unlink node
  registry.unlink(102);
  expectEqual(registry.getNodeCount(), static_cast<std::size_t>(2), "node 102 unlinked");

  if (failures > 0) {
    std::cerr << failures << " test(s) failed\n";
    return 1;
  }
  std::cout << "All C++ engine tests passed\n";
  return 0;
}
