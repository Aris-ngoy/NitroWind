#include "Tokenizer.hpp"

#include <algorithm>
#include <cctype>

namespace nitrowind::engine {

ClassToken parseClassToken(std::string_view raw) {
  ClassToken token;
  token.raw = std::string(raw);
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
      token.variants.emplace_back(input.substr(cursor, i - cursor));
      cursor = i + 1;
    }
  }
  token.utility = std::string(input.substr(cursor));
  return token;
}

std::vector<ClassToken> tokenize(std::string_view className) {
  std::vector<ClassToken> tokens;
  std::size_t start = 0;
  while (start < className.size()) {
    while (start < className.size() && std::isspace(static_cast<unsigned char>(className[start]))) {
      ++start;
    }
    if (start >= className.size()) break;
    std::size_t end = start;
    while (end < className.size() && !std::isspace(static_cast<unsigned char>(className[end]))) {
      ++end;
    }
    tokens.push_back(parseClassToken(className.substr(start, end - start)));
    start = end;
  }
  return tokens;
}

} // namespace nitrowind::engine
