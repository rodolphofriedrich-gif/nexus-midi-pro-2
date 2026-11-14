cmake_minimum_required(VERSION 3.22.1)

project(NexusNativeAudio LANGUAGES C CXX)

include(FetchContent)

# Oboe chega pelo Android Prefab (Gradle) e é consumido pelo driver oficial
# do FluidSynth. Não criamos um segundo stream/callback paralelo.
find_package(oboe CONFIG REQUIRED)

# FluidSynth permanece como biblioteca compartilhada separada para respeitar
# a forma de distribuição exigida pela LGPL-2.1.
set(BUILD_SHARED_LIBS ON CACHE BOOL "Build FluidSynth as a shared library" FORCE)
set(enable-oboe ON CACHE BOOL "Enable FluidSynth Oboe driver" FORCE)

# O NexusMIDI usa o FluidSynth como sintetizador SF2. Desabilitamos drivers
# e recursos desktop que não se aplicam ao Android para reduzir dependências.
set(enable-alsa OFF CACHE BOOL "" FORCE)
set(enable-aufile OFF CACHE BOOL "" FORCE)
set(enable-dbus OFF CACHE BOOL "" FORCE)
set(enable-jack OFF CACHE BOOL "" FORCE)
set(enable-ladspa OFF CACHE BOOL "" FORCE)
set(enable-libsndfile OFF CACHE BOOL "" FORCE)
set(enable-midishare OFF CACHE BOOL "" FORCE)
set(enable-opensles OFF CACHE BOOL "" FORCE)
set(enable-network OFF CACHE BOOL "" FORCE)
set(enable-oss OFF CACHE BOOL "" FORCE)
set(enable-pipewire OFF CACHE BOOL "" FORCE)
set(enable-pulseaudio OFF CACHE BOOL "" FORCE)
set(enable-readline OFF CACHE BOOL "" FORCE)
set(enable-sdl3 OFF CACHE BOOL "" FORCE)
set(enable-native-dls OFF CACHE BOOL "" FORCE)
set(enable-signalsmith OFF CACHE BOOL "" FORCE)
set(enable-openmp OFF CACHE BOOL "" FORCE)
set(enable-threads ON CACHE BOOL "" FORCE)

FetchContent_Declare(
    FluidSynth
    GIT_REPOSITORY https://github.com/FluidSynth/fluidsynth.git
    GIT_TAG v2.6.2
    GIT_SHALLOW TRUE
    GIT_SUBMODULES gcem
    GIT_SUBMODULES_RECURSE TRUE
)

FetchContent_MakeAvailable(FluidSynth)

if(NOT TARGET libfluidsynth)
    message(FATAL_ERROR "FluidSynth target libfluidsynth was not created")
endif()

if(NOT OBOE_SUPPORT)
    message(FATAL_ERROR "FluidSynth was configured without Oboe support")
endif()

add_library(nexus_audio SHARED native_audio_probe.cpp)

target_compile_features(nexus_audio PRIVATE cxx_std_17)
target_link_libraries(nexus_audio PRIVATE libfluidsynth)

# A validação inicial é deliberadamente pequena: comprova que o APK pode
# carregar a biblioteca nativa e que FluidSynth inicializa suas configurações.
# O backend ainda não é selecionado pelo SynthService nesta fase.
