<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

use App\Jobs\ProcessChatbotMessage;

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
            'llm_model' => env('OPENAI_MODEL', 'qwen2.5-7b-instruct'),
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
            'message' => 'Halo! Saya Patriot AI. Tanyakan kepada saya keluhan Anda atau gejala kesehatan yang Anda rasakan.',
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
        $messageId = DB::table('chat_messages')->insertGetId([
            'session_id' => $id,
            'role' => 'USER',
            'message' => $userMsg,
            'token_usage' => strlen($userMsg) / 4,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $message = DB::table('chat_messages')->where('id', $messageId)->first();
        \App\Helpers\ChatBroadcaster::broadcast($id, 'message_created', $message);

        // 2. Dispatch Asynchronous Message Processing Job
        ProcessChatbotMessage::dispatch($id, $user->id, $userMsg);

        return response()->json([
            'messages' => DB::table('chat_messages')->where('session_id', $id)->orderBy('created_at', 'asc')->get()
        ]);
    }

    public function checkLlmStatus()
    {
        $apiKey = env('OPENAI_API_KEY', 'sk-lm-6rZwLqvG:R9dpb2snWaL3XW9vpeq7');
        $baseUrl = env('OPENAI_BASE_URL', 'http://10.160.7.15:1234/v1');
        try {
            $response = Http::withToken($apiKey)->timeout(2)->get($baseUrl . '/models');
            if ($response->successful()) {
                return response()->json(['active' => true]);
            }
        } catch (\Exception $e) {}

        return response()->json(['active' => false]);
    }

    public function getAllSessionsForDoctor(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sessions = DB::table('chat_sessions')
            ->join('users', 'chat_sessions.participant_id', '=', 'users.id')
            ->select('chat_sessions.*', 'users.name as participant_name', 'users.email as participant_email')
            ->orderBy('chat_sessions.updated_at', 'desc')
            ->get();

        return response()->json($sessions);
    }

    public function getSessionMessagesForDoctor(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $messages = DB::table('chat_messages')
            ->where('session_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function createSessionForDoctor(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'participant_id' => 'required|exists:users,id'
        ]);

        $participantId = $request->participant_id;

        $sessionId = DB::table('chat_sessions')->insertGetId([
            'participant_id' => $participantId,
            'title' => 'Diskusi Medis #' . (DB::table('chat_sessions')->where('participant_id', $participantId)->count() + 1),
            'llm_model' => env('OPENAI_MODEL', 'qwen2.5-7b-instruct'),
            'summary_context' => 'General medical consultation supervised by Doctor.',
            'status' => 'ACTIVE',
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Prefill assistant welcome message
        DB::table('chat_messages')->insert([
            'session_id' => $sessionId,
            'role' => 'ASSISTANT',
            'message' => 'Halo! Saya Patriot AI. Sesi ini telah diinisiasi dan disupervisi langsung oleh Dokter Anda. Ada yang bisa kami bantu hari ini?',
            'token_usage' => 40,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $session = DB::table('chat_sessions')
            ->join('users', 'chat_sessions.participant_id', '=', 'users.id')
            ->select('chat_sessions.*', 'users.name as participant_name', 'users.email as participant_email')
            ->where('chat_sessions.id', $sessionId)
            ->first();

        return response()->json($session);
    }

    public function deleteSessionForDoctor(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::table('chat_sessions')->where('id', $id)->delete();
        return response()->json(['message' => 'Session deleted successfully']);
    }

    public function sendMessageForDoctor(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'message' => 'required|string'
        ]);

        $messageId = DB::table('chat_messages')->insertGetId([
            'session_id' => $id,
            'role' => 'ASSISTANT',
            'message' => $request->message,
            'token_usage' => strlen($request->message) / 4,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $message = DB::table('chat_messages')->where('id', $messageId)->first();
        \App\Helpers\ChatBroadcaster::broadcast($id, 'message_created', $message);

        $messages = DB::table('chat_messages')
            ->where('session_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function updateMessageForDoctor(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'message' => 'required|string'
        ]);

        DB::table('chat_messages')
            ->where('id', $id)
            ->update([
                'message' => $request->message,
                'updated_at' => now()
            ]);

        $msg = DB::table('chat_messages')->where('id', $id)->first();
        if ($msg) {
            \App\Helpers\ChatBroadcaster::broadcast($msg->session_id, 'message_updated', $msg);
        }
        return response()->json($msg);
    }

    public function deleteMessageForDoctor(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $message = DB::table('chat_messages')->where('id', $id)->first();
        if ($message) {
            DB::table('chat_messages')->where('id', $id)->delete();
            \App\Helpers\ChatBroadcaster::broadcast($message->session_id, 'message_deleted', ['id' => (int)$id]);
        }
        return response()->json(['message' => 'Message deleted successfully']);
    }
}
