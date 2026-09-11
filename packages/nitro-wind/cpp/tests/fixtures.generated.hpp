// GENERATED FILE — do not edit by hand.
// Source: packages/nitro-wind-core/src/__tests__/parity.fixtures.ts
// Generator: packages/nitro-wind/scripts/gen-cpp-fixtures.ts
// Regenerate with: bun run gen:cpp-fixtures (from packages/nitro-wind)
#pragma once

// Included into test_engine.cpp after expectEqual/asNumber/asString/Engine/
// EngineContext are already defined there — this header relies on all of
// them being in scope as ordinary file-scope symbols in the same
// translation unit, matching this project's existing single-TU test style.
inline void runParityFixtures(nitrowind::engine::Engine& engine) {
  {
  EngineContext ctx0;
  const auto result0 = engine.compute("p-4 bg-red-500", ctx0);
  expectEqual(asNumber(result0, "padding"), 16.0, "padding and a named color resolve to a flat style: padding");
  expectEqual(asString(result0, "backgroundColor"), std::string("#ef4444"), "padding and a named color resolve to a flat style: backgroundColor");
  }

  {
  EngineContext ctx1;
  const auto result1 = engine.compute("shadow-md", ctx1);
  expectEqual(asNumber(result1, "elevation"), 4.0, "shadow-md inflates shadowOffset and sets elevation: elevation");
  expectEqual(result1.style.shadowOffset.has_value(), true, "shadow-md inflates shadowOffset and sets elevation: has shadowOffset");
  expectEqual((*result1.style.shadowOffset)[0], 0.0, "shadow-md inflates shadowOffset and sets elevation: shadowOffset.width");
  expectEqual((*result1.style.shadowOffset)[1], 4.0, "shadow-md inflates shadowOffset and sets elevation: shadowOffset.height");
  }

  {
  EngineContext ctx2;
  const auto result2 = engine.compute("translate-x-4 scale-110", ctx2);
  expectEqual(result2.style.transform.size(), static_cast<std::size_t>(2), "translate and scale utilities inflate to an ordered transform array: transform length");
  expectEqual(result2.style.transform[0].first, std::string("translateX"), "translate and scale utilities inflate to an ordered transform array: transform[0].prop");
  expectEqual(std::get<double>(result2.style.transform[0].second), 16.0, "translate and scale utilities inflate to an ordered transform array: transform[0].value");
  expectEqual(result2.style.transform[1].first, std::string("scale"), "translate and scale utilities inflate to an ordered transform array: transform[1].prop");
  expectEqual(std::get<double>(result2.style.transform[1].second), 1.1, "translate and scale utilities inflate to an ordered transform array: transform[1].value");
  }

  {
  EngineContext ctx3;
  const auto result3 = engine.compute("transition-all duration-300 ease-in-out animate-spin", ctx3);
  expectEqual(result3.animation.name.has_value(), true, "animation and transition utilities populate AnimationMeta: has animation name");
  expectEqual(*result3.animation.name, std::string("spin"), "animation and transition utilities populate AnimationMeta: animation name");
  expectEqual(result3.animation.durationMs, 300.0, "animation and transition utilities populate AnimationMeta: durationMs");
  expectEqual(result3.animation.easing, std::string("ease-in-out"), "animation and transition utilities populate AnimationMeta: easing");
  expectEqual(result3.animation.transition, true, "animation and transition utilities populate AnimationMeta: transition");
  }

  {
  EngineContext ctx4;
  ctx4.colorScheme = "dark";
  const auto result4 = engine.compute("p-2 dark:bg-black ios:p-6", ctx4);
  expectEqual(asNumber(result4, "padding"), 24.0, "dark and ios variants both resolve against a combined context: padding");
  expectEqual(asString(result4, "backgroundColor"), std::string("#000000"), "dark and ios variants both resolve against a combined context: backgroundColor");
  }

  {
  EngineContext ctx5;
  ctx5.groupActive = true;
  const auto result5 = engine.compute("group-active:text-red-500", ctx5);
  expectEqual(asString(result5, "color"), std::string("#ef4444"), "group-active variant resolves when groupActive is set on context: color");
  }

  {
  EngineContext ctx6;
  const auto result6 = engine.compute("bg-red-500/50", ctx6);
  expectEqual(asString(result6, "backgroundColor"), std::string("rgba(239,68,68,0.5)"), "an alpha modifier on a named color resolves to rgba: backgroundColor");
  }

  {
  EngineContext ctx7;
  const auto result7 = engine.compute("p-[20] bg-[#ff0055] w-[50%]", ctx7);
  expectEqual(asNumber(result7, "padding"), 20.0, "arbitrary values: unitless number, hex color, and percent: padding");
  expectEqual(asString(result7, "backgroundColor"), std::string("#ff0055"), "arbitrary values: unitless number, hex color, and percent: backgroundColor");
  expectEqual(asString(result7, "width"), std::string("50%"), "arbitrary values: unitless number, hex color, and percent: width");
  }

  {
  EngineContext ctx8;
  const auto result8 = engine.compute("foo:p-4", ctx8);
  expectEqual(result8.style.props.empty(), true, "an unrecognized variant deterministically resolves to no properties: style has no properties");
  }
}
