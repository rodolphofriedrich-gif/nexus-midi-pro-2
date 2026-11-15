package com.midi.controller.keyboard.plugins;

import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(name = "NativeAudio")
public class NativeAudioPlugin extends Plugin {
    static {
        System.loadLibrary("nexus_audio");
    }

    private final Map<String, File> uploads = new ConcurrentHashMap<>();
    private native boolean nativeInitialize();
    private static native int nativeLoadSoundFont(String id, String path);
    private static native String nativeGetLastError();
    private static native boolean nativeUnloadSoundFont(String id);
    private static native void nativeNoteOn(int channel, int note, int velocity);
    private static native void nativeNoteOff(int channel, int note);
    private static native void nativeControlChange(int channel, int controller, int value);
    private static native void nativeProgramChange(int channel, int program, int bank);
    private static native void nativePitchBend(int channel, int value);
    private static native void nativeChannelPressure(int channel, int pressure);
    private static native void nativePolyPressure(int channel, int note, int pressure);
    private static native void nativeAllSoundOff();
    private static native void nativeDispose();

    @PluginMethod
    public void beginSoundFontUpload(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.trim().isEmpty()) {
            call.reject("ID do SoundFont não informado");
            return;
        }
        File file = new File(getContext().getCacheDir(), "nexus-" + id.replaceAll("[^A-Za-z0-9_-]", "_") + ".sf2");
        if (file.exists() && !file.delete()) {
            call.reject("Não foi possível preparar o arquivo SoundFont");
            return;
        }
        try {
            if (!file.createNewFile()) {
                call.reject("Não foi possível criar o arquivo SoundFont");
                return;
            }
            uploads.put(id, file);
            call.resolve();
        } catch (IOException e) {
            call.reject("Falha ao criar arquivo temporário: " + e.getMessage());
        }
    }

    @PluginMethod
    public void appendSoundFontChunk(PluginCall call) {
        String id = call.getString("id");
        String encoded = call.getString("data");
        File file = id == null ? null : uploads.get(id);
        if (file == null || encoded == null) {
            call.reject("Upload SoundFont não inicializado");
            return;
        }
        try (FileOutputStream output = new FileOutputStream(file, true)) {
            output.write(Base64.decode(encoded, Base64.DEFAULT));
            call.resolve();
        } catch (Exception e) {
            call.reject("Falha ao gravar parte do SoundFont: " + e.getMessage());
        }
    }

    @PluginMethod
    public void finishSoundFontUpload(PluginCall call) {
        String id = call.getString("id");
        File file = id == null ? null : uploads.remove(id);
        if (file == null || !file.isFile() || file.length() == 0) {
            call.reject("Arquivo SoundFont incompleto");
            return;
        }
        int sfid = nativeLoadSoundFont(id, file.getAbsolutePath());
        if (sfid < 0) {
            String detail = nativeGetLastError();
            long bytes = file.length();
            file.delete();
            call.reject("FluidSynth não conseguiu carregar o SoundFont (" + bytes + " bytes). " + detail);
            return;
        }
        file.delete();
        JSObject result = new JSObject();
        result.put("soundFontId", sfid);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelSoundFontUpload(PluginCall call) {
        String id = call.getString("id");
        File file = id == null ? null : uploads.remove(id);
        if (file != null) file.delete();
        call.resolve();
    }

    @PluginMethod
    public void removeSoundBank(PluginCall call) {
        String id = call.getString("id");
        if (id == null || !nativeUnloadSoundFont(id)) {
            call.reject("Não foi possível remover o SoundFont");
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void noteOn(PluginCall call) {
        nativeNoteOn(call.getInt("channel", 0), call.getInt("note", 60), call.getInt("velocity", 100));
        call.resolve();
    }

    @PluginMethod
    public void noteOff(PluginCall call) {
        nativeNoteOff(call.getInt("channel", 0), call.getInt("note", 60));
        call.resolve();
    }

    @PluginMethod
    public void controlChange(PluginCall call) {
        nativeControlChange(call.getInt("channel", 0), call.getInt("controller", 0), call.getInt("value", 0));
        call.resolve();
    }

    @PluginMethod
    public void programChange(PluginCall call) {
        nativeProgramChange(
            call.getInt("channel", 0),
            call.getInt("program", 0),
            call.getInt("bank", 0)
        );
        call.resolve();
    }

    @PluginMethod
    public void pitchBend(PluginCall call) {
        nativePitchBend(call.getInt("channel", 0), call.getInt("value", 8192));
        call.resolve();
    }

    @PluginMethod
    public void channelPressure(PluginCall call) {
        nativeChannelPressure(call.getInt("channel", 0), call.getInt("pressure", 0));
        call.resolve();
    }

    @PluginMethod
    public void polyPressure(PluginCall call) {
        nativePolyPressure(call.getInt("channel", 0), call.getInt("note", 60), call.getInt("pressure", 0));
        call.resolve();
    }

    @PluginMethod
    public void allSoundOff(PluginCall call) {
        nativeAllSoundOff();
        call.resolve();
    }

    @PluginMethod
    public void resume(PluginCall call) {
        if (!nativeInitialize()) {
            call.reject("Motor de áudio nativo indisponível. " + nativeGetLastError());
            return;
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        for (File file : uploads.values()) file.delete();
        uploads.clear();
        nativeDispose();
        super.handleOnDestroy();
    }
}
