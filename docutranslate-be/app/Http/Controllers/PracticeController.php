<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PracticeController extends Controller
{
    /**
     * Start a new practice session.
     */
    public function startSession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'target_language' => 'required|string|max:10',
            'mode' => 'required|in:reading,listening,speaking,writing',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $session = [
            'id' => uniqid('sess_'),
            'user_id' => Auth::id(),
            'target_language' => $request->input('target_language'),
            'mode' => $request->input('mode'),
            'started_at' => now()->toISOString(),
        ];

        return response()->json([
            'success' => true,
            'data' => $session,
        ], 201);
    }

    /**
     * Submit an attempt within a practice session (stub scoring).
     */
    public function submitAttempt(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|string',
            'prompt_id' => 'required|string',
            'answer_text' => 'nullable|string',
            'answer_audio' => 'nullable|file|mimes:mp3,wav,m4a,ogg|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Very naive scoring stub
        $score = 0;
        if ($request->filled('answer_text')) {
            $len = strlen($request->input('answer_text'));
            $score = min(100, max(10, intval($len / 3)));
        } elseif ($request->hasFile('answer_audio')) {
            $score = 70; // pretend decent pronunciation
        }

        return response()->json([
            'success' => true,
            'data' => [
                'session_id' => $request->input('session_id'),
                'prompt_id' => $request->input('prompt_id'),
                'score' => $score,
                'feedback' => $score > 60 ? 'Good job! Keep practicing.' : 'Try to be clearer and use longer sentences.',
                'evaluated_at' => now()->toISOString(),
            ],
        ], 201);
    }
} 