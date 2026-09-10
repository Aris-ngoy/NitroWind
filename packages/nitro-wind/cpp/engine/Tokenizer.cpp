#include "Tokenizer.hpp"

#include <algorithm>

namespace nitrowind::engine {

ClassTokenView parseClassToken(std::string_view raw) {
  ClassTokenView token;
  token.raw = raw;
  std::string_view input = raw;
  if (!input.empty() && input.front() == '!') {
    token.important = true;
    input.remove_prefix(1);
  }

  std::size_t cursor = 0;
  int bracket = 0;
  for (std::size_t i = 0; i < input.size(); ++i) {
    const char ch = input[i];
    if (ch == '[') {
      ++bracket;
    } else if (ch == ']') {
      bracket = std::max(0, bracket - 1);
    } else if (ch == ':' && bracket == 0) {
      if (token.variantCount < token.variants.size()) {
        token.variants[token.variantCount++] = input.substr(cursor, i - cursor);
      }
      cursor = i + 1;
    }
  }
  token.utility = input.substr(cursor);
  return token;
}

} // namespace nitrowind::engine
