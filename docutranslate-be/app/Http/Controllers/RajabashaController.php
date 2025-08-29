<?php

namespace App\Http\Controllers;

use App\Models\RajabashaPaper;
use App\Models\RajabashaQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RajabashaController extends Controller
{
    public function listPapers()
    {
        $papers = RajabashaPaper::withCount('questions')->latest()->get();
        return response()->json(['success' => true, 'data' => $papers]);
    }

    public function createPaper(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'language' => 'nullable|string|max:10',
        ]);

        $paper = RajabashaPaper::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'language' => $validated['language'] ?? 'ta',
            'created_by' => Auth::id(),
        ]);

        return response()->json(['success' => true, 'data' => $paper], 201);
    }

    public function listQuestions($paperId)
    {
        $paper = RajabashaPaper::findOrFail($paperId);
        $questions = RajabashaQuestion::where('paper_id', $paper->id)->get();
        return response()->json(['success' => true, 'data' => [
            'paper' => $paper,
            'questions' => $questions,
        ]]);
    }

    public function createQuestion(Request $request, $paperId)
    {
        $paper = RajabashaPaper::findOrFail($paperId);

        $validated = $request->validate([
            'question_text' => 'required|string',
            'question_type' => 'nullable|in:mcq,short',
            'options' => 'nullable|array',
            'answer_key' => 'nullable|string',
            'marks' => 'nullable|integer|min:1',
        ]);

        $question = RajabashaQuestion::create([
            'paper_id' => $paper->id,
            'question_text' => $validated['question_text'],
            'question_type' => $validated['question_type'] ?? 'mcq',
            'options' => $validated['options'] ?? null,
            'answer_key' => $validated['answer_key'] ?? null,
            'marks' => $validated['marks'] ?? 1,
        ]);

        return response()->json(['success' => true, 'data' => $question], 201);
    }

    public function submitAttempt(Request $request, $paperId)
    {
        $paper = RajabashaPaper::findOrFail($paperId);

        $validated = $request->validate([
            'answers' => 'required|array', // { [questionId]: userAnswer }
        ]);

        $answers = $validated['answers'];
        $questions = RajabashaQuestion::where('paper_id', $paper->id)->get();

        $score = 0;
        $total = 0;
        foreach ($questions as $q) {
            $total += (int)($q->marks ?? 1);
            $userAnswer = $answers[$q->id] ?? null;
            if ($q->question_type === 'mcq') {
                if ($userAnswer !== null && (string)$userAnswer === (string)$q->answer_key) {
                    $score += (int)($q->marks ?? 1);
                }
            } else {
                // For short answers, simple exact match; can be improved later
                if ($userAnswer !== null && trim(mb_strtolower((string)$userAnswer)) === trim(mb_strtolower((string)($q->answer_key ?? '')))) {
                    $score += (int)($q->marks ?? 1);
                }
            }
        }

        DB::table('rajabasha_attempts')->insert([
            'user_id' => Auth::id(),
            'paper_id' => $paper->id,
            'answers' => json_encode($answers),
            'score' => $score,
            'total' => $total,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'data' => [
            'score' => $score,
            'total' => $total,
        ]]);
    }
} 