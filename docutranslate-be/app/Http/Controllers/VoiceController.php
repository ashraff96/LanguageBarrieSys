<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class VoiceController extends Controller
{
    /**
     * Transcribe and translate an uploaded audio file (stub implementation).
     */
    public function transcribeAndTranslate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'audio' => 'required|file|mimes:mp3,wav,m4a,ogg|max:20480', // 20MB
            'target_language' => 'required|string|max:10',
            'source_language' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = Auth::id();
        $audio = $request->file('audio');
        $storedName = time() . '_' . uniqid() . '.' . $audio->getClientOriginalExtension();
        $path = $audio->storeAs('voice_uploads', $storedName, 'public');

        // Stubbed transcription and translation result
        $transcript = 'This is a stubbed transcript.';
        $translated = 'Esto es una transcripción simulada.';

        return response()->json([
            'success' => true,
            'data' => [
                'audio_path' => $path,
                'user_id' => $userId,
                'source_language' => $request->input('source_language') ?? 'auto',
                'target_language' => $request->input('target_language'),
                'transcript' => $transcript,
                'translation' => $translated,
            ],
        ], 201);
    }
} 