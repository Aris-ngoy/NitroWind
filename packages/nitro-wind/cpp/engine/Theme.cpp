#include "Theme.hpp"

#include <cstdio>
#include <cstring>

namespace nitrowind::engine {
namespace {

const char* kShades[] = {"50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"};

struct Palette {
  const char* name;
  const char* hex[11];
};

constexpr Palette kPalettes[] = {
    {"slate", {"#f8fafc", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#475569", "#334155", "#1e293b", "#0f172a", "#020617"}},
    {"gray", {"#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151", "#1f2937", "#111827", "#030712"}},
    {"zinc", {"#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b"}},
    {"neutral", {"#fafafa", "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626", "#171717", "#0a0a0a"}},
    {"stone", {"#fafaf9", "#f5f5f4", "#e7e5e4", "#d6d3d1", "#a8a29e", "#78716c", "#57534e", "#44403c", "#292524", "#1c1917", "#0c0a09"}},
    {"red", {"#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"}},
    {"orange", {"#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12", "#431407"}},
    {"amber", {"#fffbeb", "#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f", "#451a03"}},
    {"yellow", {"#fefce8", "#fef9c3", "#fef08a", "#fde047", "#facc15", "#eab308", "#ca8a04", "#a16207", "#854d0e", "#713f12", "#422006"}},
    {"lime", {"#f7fee7", "#ecfccb", "#d9f99d", "#bef264", "#a3e635", "#84cc16", "#65a30d", "#4d7c0f", "#3f6212", "#365314", "#1a2e05"}},
    {"green", {"#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"}},
    {"emerald", {"#ecfdf5", "#d1fae5", "#a7f3d0", "#6ee7b7", "#34d399", "#10b981", "#059669", "#047857", "#065f46", "#064e3b", "#022c22"}},
    {"teal", {"#f0fdfa", "#ccfbf1", "#99f6e4", "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e", "#115e59", "#134e4a", "#042f2e"}},
    {"cyan", {"#ecfeff", "#cffafe", "#a5f3fc", "#67e8f9", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63", "#083344"}},
    {"sky", {"#f0f9ff", "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e", "#082f49"}},
    {"blue", {"#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"}},
    {"indigo", {"#eef2ff", "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81", "#1e1b4b"}},
    {"violet", {"#f5f3ff", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#2e1065"}},
    {"purple", {"#faf5ff", "#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#3b0764"}},
    {"fuchsia", {"#fdf4ff", "#fae8ff", "#f5d0fe", "#f0abfc", "#e879f9", "#d946ef", "#c026d3", "#a21caf", "#86198f", "#701a75", "#4a044e"}},
    {"pink", {"#fdf2f8", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d", "#9d174d", "#831843", "#500724"}},
    {"rose", {"#fff1f2", "#ffe4e6", "#fecdd3", "#fda4af", "#fb7185", "#f43f5e", "#e11d48", "#be123c", "#9f1239", "#881337", "#4c0519"}},
};

SvMap<std::string> buildColorMap() {
  SvMap<std::string> colors;
  colors.emplace("transparent", "transparent");
  colors.emplace("black", "#000000");
  colors.emplace("white", "#ffffff");
  colors.emplace("inherit", "inherit");
  colors.emplace("current", "currentColor");
  for (const auto& palette : kPalettes) {
    for (int i = 0; i < 11; ++i) {
      std::string key;
      key.reserve(std::strlen(palette.name) + 1 + std::strlen(kShades[i]));
      key.append(palette.name);
      key.push_back('-');
      key.append(kShades[i]);
      colors.emplace(std::move(key), palette.hex[i]);
    }
  }
  return colors;
}

const SvMap<std::string>& colorMap() {
  static const auto map = buildColorMap();
  return map;
}

int hexNibble(char ch) {
  if (ch >= '0' && ch <= '9') return ch - '0';
  if (ch >= 'a' && ch <= 'f') return ch - 'a' + 10;
  if (ch >= 'A' && ch <= 'F') return ch - 'A' + 10;
  return 0;
}

int hexByte(std::string_view pair) {
  return hexNibble(pair[0]) * 16 + hexNibble(pair[1]);
}

} // namespace

const SvMap<double>& spacingScale() {
  static const SvMap<double> scale = {
      {"0", 0}, {"px", 1}, {"0.5", 2}, {"1", 4}, {"1.5", 6}, {"2", 8}, {"2.5", 10},
      {"3", 12}, {"3.5", 14}, {"4", 16}, {"5", 20}, {"6", 24}, {"7", 28}, {"8", 32},
      {"9", 36}, {"10", 40}, {"11", 44}, {"12", 48}, {"14", 56}, {"16", 64}, {"20", 80},
      {"24", 96}, {"28", 112}, {"32", 128}, {"36", 144}, {"40", 160}, {"44", 176},
      {"48", 192}, {"52", 208}, {"56", 224}, {"60", 240}, {"64", 256}, {"72", 288},
      {"80", 320}, {"96", 384},
  };
  return scale;
}

const SvMap<double>& fontSizeScale() {
  static const SvMap<double> scale = {
      {"xs", 12}, {"sm", 14}, {"base", 16}, {"lg", 18}, {"xl", 20}, {"2xl", 24},
      {"3xl", 30}, {"4xl", 36}, {"5xl", 48}, {"6xl", 60}, {"7xl", 72}, {"8xl", 96}, {"9xl", 128},
  };
  return scale;
}

const SvMap<std::string>& fontWeightScale() {
  static const SvMap<std::string> scale = {
      {"thin", "100"}, {"extralight", "200"}, {"light", "300"}, {"normal", "400"},
      {"medium", "500"}, {"semibold", "600"}, {"bold", "700"}, {"extrabold", "800"}, {"black", "900"},
  };
  return scale;
}

const SvMap<double>& radiusScale() {
  static const SvMap<double> scale = {
      {"none", 0}, {"sm", 2}, {"DEFAULT", 4}, {"md", 6}, {"lg", 8},
      {"xl", 12}, {"2xl", 16}, {"3xl", 24}, {"full", 9999},
  };
  return scale;
}

const SvMap<double>& breakpointScale() {
  static const SvMap<double> scale = {
      {"sm", 640}, {"md", 768}, {"lg", 1024}, {"xl", 1280}, {"2xl", 1536},
  };
  return scale;
}

const SvMap<double>& opacityScale() {
  static const SvMap<double> scale = {
      {"0", 0}, {"5", 0.05}, {"10", 0.1}, {"15", 0.15}, {"20", 0.2}, {"25", 0.25},
      {"30", 0.3}, {"40", 0.4}, {"50", 0.5}, {"60", 0.6}, {"70", 0.7}, {"75", 0.75},
      {"80", 0.8}, {"90", 0.9}, {"95", 0.95}, {"100", 1},
  };
  return scale;
}

const SvMap<double>& zIndexScale() {
  static const SvMap<double> scale = {
      {"0", 0}, {"10", 10}, {"20", 20}, {"30", 30}, {"40", 40}, {"50", 50},
  };
  return scale;
}

const SvMap<double>& durationScale() {
  static const SvMap<double> scale = {
      {"75", 75}, {"100", 100}, {"150", 150}, {"200", 200},
      {"300", 300}, {"500", 500}, {"700", 700}, {"1000", 1000},
  };
  return scale;
}

std::optional<std::string_view> resolveColor(std::string_view token) {
  const auto& colors = colorMap();
  auto it = colors.find(token);
  if (it == colors.end()) return std::nullopt;
  return it->second;
}

std::string applyAlpha(std::string_view color, double alpha) {
  if (color == "transparent" || color.size() != 7 || color.front() != '#') {
    return std::string(color);
  }
  const auto hex = color.substr(1);
  const int r = hexByte(hex.substr(0, 2));
  const int g = hexByte(hex.substr(2, 2));
  const int b = hexByte(hex.substr(4, 2));
  char buf[64];
  const int n = std::snprintf(buf, sizeof(buf), "rgba(%d,%d,%d,%g)", r, g, b, alpha);
  if (n <= 0) return std::string(color);
  return std::string(buf, static_cast<std::size_t>(n));
}

} // namespace nitrowind::engine
