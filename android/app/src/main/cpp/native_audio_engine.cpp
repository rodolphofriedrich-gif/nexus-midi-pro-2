#include <jni.h>
#include <fluidsynth.h>

#include <mutex>
#include <string>
#include <unordered_map>

namespace {
std::mutex g_mutex;
fluid_settings_t* g_settings = nullptr;
fluid_synth_t* g_synth = nullptr;
fluid_audio_driver_t* g_driver = nullptr;
std::unordered_map<std::string, int> g_soundfonts;
int g_default_sfid = -1;
std::string g_last_error = "Nenhum erro nativo registrado";

bool ensureEngine() {
    if (g_synth != nullptr && g_driver != nullptr) return true;

    g_last_error.clear();
    g_settings = new_fluid_settings();
    if (g_settings == nullptr) { g_last_error = "FluidSynth não criou as configurações"; return false; }

    if (fluid_settings_setstr(g_settings, "audio.driver", "oboe") != FLUID_OK) {
        delete_fluid_settings(g_settings);
        g_settings = nullptr;
        g_last_error = "FluidSynth não reconheceu o driver de áudio Oboe";
        return false;
    }

    g_synth = new_fluid_synth(g_settings);
    if (g_synth == nullptr) {
        delete_fluid_settings(g_settings);
        g_settings = nullptr;
        g_last_error = "FluidSynth não conseguiu criar o sintetizador";
        return false;
    }

    g_driver = new_fluid_audio_driver(g_settings, g_synth);
    if (g_driver == nullptr) {
        delete_fluid_synth(g_synth);
        delete_fluid_settings(g_settings);
        g_synth = nullptr;
        g_settings = nullptr;
        g_last_error = "FluidSynth não conseguiu iniciar a saída de áudio Oboe";
        return false;
    }
    g_last_error.clear();
    return true;
}

std::string toString(JNIEnv* env, jstring value) {
    if (value == nullptr) return {};
    const char* chars = env->GetStringUTFChars(value, nullptr);
    if (chars == nullptr) return {};
    std::string result(chars);
    env->ReleaseStringUTFChars(value, chars);
    return result;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeInitialize(JNIEnv*, jclass) {
    std::lock_guard<std::mutex> lock(g_mutex);
    return ensureEngine() ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeLoadSoundFont(
    JNIEnv* env, jclass, jstring idValue, jstring pathValue) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (!ensureEngine()) return -1;

    const std::string id = toString(env, idValue);
    const std::string path = toString(env, pathValue);
    if (id.empty() || path.empty()) return -1;

    auto existing = g_soundfonts.find(id);
    if (existing != g_soundfonts.end()) {
        fluid_synth_sfunload(g_synth, existing->second, 1);
        g_soundfonts.erase(existing);
    }

    const int sfid = fluid_synth_sfload(g_synth, path.c_str(), 1);
    if (sfid == FLUID_FAILED) { g_last_error = "fluid_synth_sfload retornou FLUID_FAILED ao interpretar o SF2"; return -1; }
    g_last_error.clear();

    g_soundfonts[id] = sfid;
    if (g_default_sfid < 0) g_default_sfid = sfid;
    return sfid;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeUnloadSoundFont(
    JNIEnv* env, jclass, jstring idValue) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth == nullptr) return JNI_TRUE;
    const std::string id = toString(env, idValue);
    auto it = g_soundfonts.find(id);
    if (it == g_soundfonts.end()) return JNI_TRUE;
    const int sfid = it->second;
    const bool ok = fluid_synth_sfunload(g_synth, sfid, 1) == FLUID_OK;
    g_soundfonts.erase(it);
    if (g_default_sfid == sfid) {
        g_default_sfid = g_soundfonts.empty() ? -1 : g_soundfonts.begin()->second;
    }
    return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeNoteOn(
    JNIEnv*, jclass, jint channel, jint note, jint velocity) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) fluid_synth_noteon(g_synth, channel, note, velocity);
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeNoteOff(
    JNIEnv*, jclass, jint channel, jint note) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) fluid_synth_noteoff(g_synth, channel, note);
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeControlChange(
    JNIEnv*, jclass, jint channel, jint controller, jint value) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) fluid_synth_cc(g_synth, channel, controller, value);
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeProgramChange(
    JNIEnv*, jclass, jint channel, jint program, jint bank) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) {
        if (bank >= 0) fluid_synth_bank_select(g_synth, channel, bank);
        fluid_synth_program_change(g_synth, channel, program);
    }
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativePitchBend(
    JNIEnv*, jclass, jint channel, jint value) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) fluid_synth_pitch_bend(g_synth, channel, value);
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeChannelPressure(
    JNIEnv*, jclass, jint channel, jint pressure) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) fluid_synth_channel_pressure(g_synth, channel, pressure);
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativePolyPressure(
    JNIEnv*, jclass, jint channel, jint note, jint pressure) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth != nullptr) fluid_synth_key_pressure(g_synth, channel, note, pressure);
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeAllSoundOff(JNIEnv*, jclass) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_synth == nullptr) return;
    for (int channel = 0; channel < 16; ++channel) {
        fluid_synth_cc(g_synth, channel, 64, 0);
        fluid_synth_all_sounds_off(g_synth, channel);
    }
}

extern "C" JNIEXPORT void JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeDispose(JNIEnv*, jclass) {
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_driver != nullptr) {
        delete_fluid_audio_driver(g_driver);
        g_driver = nullptr;
    }
    if (g_synth != nullptr) {
        delete_fluid_synth(g_synth);
        g_synth = nullptr;
    }
    if (g_settings != nullptr) {
        delete_fluid_settings(g_settings);
        g_settings = nullptr;
    }
    g_soundfonts.clear();
    g_default_sfid = -1;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeGetLastError(JNIEnv* env, jclass) {
    std::lock_guard<std::mutex> lock(g_mutex);
    return env->NewStringUTF(g_last_error.empty() ? "Sem detalhe adicional" : g_last_error.c_str());
}
