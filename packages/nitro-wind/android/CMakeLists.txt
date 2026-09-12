project(Nitrowind)
cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME Nitrowind)
set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 20)

# Enable Raw Props parsing in react-native (for Nitro Views)
add_compile_options(-DRN_SERIALIZABLE_STATE=1)

file(GLOB_RECURSE NITRO_WIND_CPP CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/../cpp/*.cpp)
list(FILTER NITRO_WIND_CPP EXCLUDE REGEX ".*/tests/.*")

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
        src/main/cpp/cpp-adapter.cpp
        ${NITRO_WIND_CPP}
)

# Add Nitrogen specs :)
include(${CMAKE_CURRENT_SOURCE_DIR}/../nitrogen/generated/android/Nitrowind+autolinking.cmake)

# Set up local includes
include_directories(
        "src/main/cpp"
        "../cpp"
)

find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android                                   # <-- Android core
)
