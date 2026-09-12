cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# RN New Architecture app CMake add_subdirectory()s this folder and expects a
# react_codegen_<libraryName> target. The real Nitro shared library is built by
# android/CMakeLists.txt via Gradle; this object library only satisfies autolinking.
add_library(react_codegen_Nitrowind OBJECT Nitrowind-codegen-stub.cpp)
target_include_directories(react_codegen_Nitrowind PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
