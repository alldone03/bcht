<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatBroadcaster
{
    /**
     * Broadcast chat message event to WebSocket server.
     *
     * @param int $sessionId
     * @param string $event (e.g. 'message_created', 'message_updated', 'message_deleted')
     * @param mixed $data (the message array or payload)
     * @return void
     */
    public static function broadcast($sessionId, $event, $data)
    {
        $url = env('WEBSOCKET_BROADCAST_URL', 'http://localhost:6001/broadcast');
        
        try {
            Http::timeout(2)->post($url, [
                'sessionId' => (int)$sessionId,
                'event' => $event,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::warning("WebSocket broadcast failed: " . $e->getMessage());
        }
    }
}
