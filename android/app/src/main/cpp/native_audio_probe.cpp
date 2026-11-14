#include <jni.h>
#include <fluidsynth.h>

extern "C" JNIEXPORT jboolean JNICALL
Java_com_midi_controller_keyboard_plugins_NativeAudioPlugin_nativeProbeFluidSynth(
    JNIEnv*, jclass) {
    fluid_settings_t* settings = new_fluid_settings();
    if (settings == nullptr) {
        return JNI_FALSE;
    }

    delete_fluid_settings(settings);
    return JNI_TRUE;
}
