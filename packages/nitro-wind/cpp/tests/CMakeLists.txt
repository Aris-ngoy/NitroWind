cmake_minimum_required(VERSION 3.9.0)
project(nitro_wind_engine_tests CXX)
set(CMAKE_CXX_STANDARD 20)

add_executable(nitro_wind_engine_tests
  test_engine.cpp
  ../engine/Tokenizer.cpp
  ../engine/Parser.cpp
  ../engine/Theme.cpp
  ../engine/Inflate.cpp
  ../engine/StyleCache.cpp
  ../engine/Engine.cpp
)

target_include_directories(nitro_wind_engine_tests PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/..)
