<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ChatController extends Controller
{
    public function getSessions(Request $request)
    {
        $sessions = DB::table('chat_sessions')
            ->where('participant_id', $request->user()->id)
            ->orderBy('started_at', 'desc')
            ->get();
        return response()->json($sessions);
    }

    public function createSession(Request $request)
    {
        $sessionId = DB::table('chat_sessions')->insertGetId([
            'participant_id' => $request->user()->id,
            'title' => 'Diskusi Medis #' . (DB::table('chat_sessions')->where('participant_id', $request->user()->id)->count() + 1),
            'llm_model' => 'Gemini 3.5 Flash',
            'summary_context' => 'General medical consultation.',
            'status' => 'ACTIVE',
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Prefill assistant welcome message
        DB::table('chat_messages')->insert([
            'session_id' => $sessionId,
            'role' => 'ASSISTANT',
            'message' => 'Halo! Saya Patriot AI. Tanyakan kepada saya keluhan Anda, gejala kesehatan, atau mintalah bantuan untuk menjelaskan riwayat screening M-EWS Anda.',
            'token_usage' => 40,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $session = DB::table('chat_sessions')->where('id', $sessionId)->first();
        return response()->json($session);
    }

    public function deleteSession($id)
    {
        DB::table('chat_sessions')->where('id', $id)->delete();
        return response()->json(['message' => 'Session deleted successfully']);
    }

    public function getMessages($id)
    {
        $messages = DB::table('chat_messages')
            ->where('session_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();
        return response()->json($messages);
    }

    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string'
        ]);

        $user = $request->user();
        $userMsg = $request->message;

        // 1. Insert User Message
        DB::table('chat_messages')->insert([
            'session_id' => $id,
            'role' => 'USER',
            'message' => $userMsg,
            'token_usage' => strlen($userMsg) / 4,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 2. Fetch latest screening result context to customize LLM response
        $latestResult = DB::table('screening_results')
            ->join('screening_sessions', 'screening_results.session_id', '=', 'screening_sessions.id')
            ->where('screening_sessions.participant_id', $user->id)
            ->orderBy('screening_results.created_at', 'desc')
            ->select('screening_results.*')
            ->first();

        $screeningContext = "";
        if ($latestResult) {
            $screeningContext = "Pasien memiliki riwayat tes M-EWS dengan klasifikasi '{$latestResult->classification}' (skor {$latestResult->total_score}).";
        }

        // 3. Connect to LLM
        $botReply = "";
        try {
            $response = Http::timeout(3)->post('http://llm_mock:5000', [
                'message' => $userMsg,
                'context' => $screeningContext
            ]);
            if ($response->successful()) {
                $botReply = $response->json()['reply'];
            }
        } catch (\Exception $e) {
            // fallback simulated LLM response
            $botReply = "Halo {$user->name}. Sebagai Patriot AI pendamping Anda, saya menganalisis keluhan Anda mengenai '{$userMsg}'. " . 
                        ($latestResult ? "Berdasarkan tes M-EWS terakhir Anda dengan klasifikasi *{$latestResult->classification}* (skor {$latestResult->total_score}), disarankan untuk mengikuti rekomendasi medis berikut: '{$latestResult->recommendation}'." : "Harap isi screening kesehatan M-EWS terlebih dahulu agar kami dapat mendeteksi kondisi klinis Anda dengan akurat.");
        }

        // 4. Save Assistant Response
        DB::table('chat_messages')->insert([
            'session_id' => $id,
            'role' => 'ASSISTANT',
            'message' => $botReply,
            'token_usage' => strlen($botReply) / 4,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'messages' => DB::table('chat_messages')->where('session_id', $id)->orderBy('created_at', 'asc')->get()
        ]);
    }
}
