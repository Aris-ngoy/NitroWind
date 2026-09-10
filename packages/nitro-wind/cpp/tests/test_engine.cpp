#include "engine/Engine.hpp"
#include "engine/Parser.hpp"
#include "engine/Tokenizer.hpp"

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

int main() {
  EngineContext context;

  const auto tokens = tokenize("dark:ios:p-4 bg-red-500");
  expectEqual(tokens.size(), static_cast<std::size_t>(2), "tokenize splits class names");
  expectEqual(tokens[0].utility, std::string("p-4"), "first utility is p-4");
  expectEqual(tokens[0].variants.size(), static_cast<std::size_t>(2), "stacked variants parsed");

  Engine engine;
  const auto style = engine.compute("p-4 bg-red-500", context);
  expectEqual(asNumber(style, "padding"), 16.0, "p-4 -> padding 16");
  expectEqual(asString(style, "backgroundColor"), std::string("#ef4444"), "bg-red-500 -> #ef4444");

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

  engine.compute("flex-1 items-center", context);
  engine.compute("flex-1 items-center", context);
  expectEqual(engine.getCacheSize(), 2.0, "cache stores unique class names");

  if (failures > 0) {
    std::cerr << failures << " test(s) failed\n";
    return 1;
  }
  std::cout << "All C++ engine tests passed\n";
  return 0;
}
