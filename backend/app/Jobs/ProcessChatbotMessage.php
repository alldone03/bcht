<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Exception;

class ProcessChatbotMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $sessionId;
    protected $userId;
    protected $userMsg;

    public function __construct($sessionId, $userId, $userMsg)
    {
        $this->sessionId = $sessionId;
        $this->userId = $userId;
        $this->userMsg = $userMsg;
    }

    public function handle(): void
    {
        $user = User::findOrFail($this->userId);

        // 1. Connect to LM Studio Chat Completions API
        $botReply = "";
        $apiKey = env('OPENAI_API_KEY', 'sk-lm-6rZwLqvG:R9dpb2snWaL3XW9vpeq7');
        $baseUrl = env('OPENAI_BASE_URL', 'http://10.160.7.15:1234/v1');
        $model = env('OPENAI_MODEL', 'qwen2.5-7b-instruct');

        try {
            $response = Http::withToken($apiKey)->timeout(30)->post($baseUrl . '/chat/completions', [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system', 
                        'content' => "Anda adalah Patriot AI, asisten pendamping medis pintar. Analisis keluhan pasien secara sopan, ringkas, dan jelas dalam Bahasa Indonesia."
                    ],
                    [
                        'role' => 'user', 
                        'content' => $this->userMsg
                    ]
                ],
                'temperature' => 0.7
            ]);

            if ($response->successful()) {
                $jsonData = $response->json();
                $botReply = $jsonData['choices'][0]['message']['content'] ?? '';
            }
        } catch (Exception $e) {
            // Log or handle endpoint offline state
        }

        // 2. Fallback simulated LLM response if LM Studio is offline or times out
        if (empty($botReply)) {
            $botReply = "Halo {$user->name}. Sebagai Patriot AI pendamping Anda, saya menganalisis keluhan Anda mengenai '{$this->userMsg}'.";
        }

        // 4. Save Assistant Response
        $messageId = DB::table('chat_messages')->insertGetId([
            'session_id' => $this->sessionId,
            'role' => 'ASSISTANT',
            'message' => $botReply,
            'token_usage' => strlen($botReply) / 4,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $message = DB::table('chat_messages')->where('id', $messageId)->first();
        \App\Helpers\ChatBroadcaster::broadcast($this->sessionId, 'message_created', $message);
    }
}
