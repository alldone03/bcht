<?php

namespace App\Services;

use App\Models\ScreeningTemplate;
use App\Models\ScreeningParameter;
use App\Models\ScreeningQuestion;
use App\Models\ScreeningAnswer;
use App\Models\ScreeningSession;
use App\Models\ScreeningSessionAnswer;
use App\Models\ScreeningResult;
use Illuminate\Support\Facades\DB;
use Exception;

class MewsScreeningService
{
    public function createTemplate(array $data): ScreeningTemplate
    {
        return ScreeningTemplate::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);
    }

    public function createParameter(array $data): ScreeningParameter
    {
        return ScreeningParameter::create([
            'template_id' => $data['template_id'],
            'name' => $data['name'],
            'order_number' => $data['order_number'],
        ]);
    }

    public function createQuestion(array $data): ScreeningQuestion
    {
        return ScreeningQuestion::create([
            'parameter_id' => $data['parameter_id'],
            'question' => $data['question'],
        ]);
    }

    public function createAnswer(array $data): ScreeningAnswer
    {
        return ScreeningAnswer::create([
            'question_id' => $data['question_id'],
            'answer' => $data['answer'],
            'score' => $data['score'],
            'severity_color' => $data['severity_color'],
        ]);
    }

    public function startScreening($participantId, $templateId): ScreeningSession
    {
        return ScreeningSession::create([
            'participant_id' => $participantId,
            'template_id' => $templateId,
            'started_at' => now(),
            'finished_at' => null,
        ]);
    }

    public function submitAnswer($sessionId, $questionId, $answerId): ScreeningSessionAnswer
    {
        $answerOption = ScreeningAnswer::findOrFail($answerId);

        return ScreeningSessionAnswer::updateOrCreate(
            [
                'session_id' => $sessionId,
                'question_id' => $questionId,
            ],
            [
                'answer_id' => $answerId,
                'score' => $answerOption->score,
            ]
        );
    }

    public function calculateResult($sessionId): array
    {
        $session = ScreeningSession::findOrFail($sessionId);
        $answers = $session->sessionAnswers;

        if ($answers->isEmpty()) {
            throw new Exception("No answers submitted for this session.");
        }

        $totalScore = $answers->sum('score');
        $highestScore = $answers->max('score');

        // Rule Engine Classification
        if ($highestScore === 2) {
            $classification = 'RED';
            $recommendation = 'Segera lakukan evakuasi medis.';
        } elseif ($highestScore === 1) {
            $classification = 'YELLOW';
            $recommendation = 'Istirahat, observasi ulang 2-4 jam, konsultasikan apabila memburuk.';
        } else {
            $classification = 'GREEN';
            $recommendation = 'Lanjutkan aktivitas normal.';
        }

        return [
            'session_id' => $sessionId,
            'total_score' => $totalScore,
            'highest_score' => $highestScore,
            'classification' => $classification,
            'recommendation' => $recommendation,
        ];
    }

    public function saveResult($sessionId, array $calculatedData): ScreeningResult
    {
        return DB::transaction(function () use ($sessionId, $calculatedData) {
            $session = ScreeningSession::findOrFail($sessionId);
            $session->update([
                'finished_at' => now()
            ]);

            $result = ScreeningResult::updateOrCreate(
                ['session_id' => $sessionId],
                [
                    'total_score' => $calculatedData['total_score'],
                    'highest_score' => $calculatedData['highest_score'],
                    'classification' => $calculatedData['classification'],
                    'recommendation' => $calculatedData['recommendation'],
                    'status' => 'PENDING',
                ]
            );

            if (in_array($calculatedData['classification'], ['YELLOW', 'RED'])) {
                \App\Models\Notification::create([
                    'user_id' => $session->participant_id,
                    'message' => "Peringatan: Hasil screening M-EWS Anda menunjukkan kondisi *{$calculatedData['classification']}* (Skor: {$calculatedData['total_score']}). Harap ikuti rekomendasi: '{$calculatedData['recommendation']}' dan segera hubungi tim medis.",
                    'is_read' => false
                ]);
            }

            return $result;
        });
    }

    public function getResult($sessionId): array
    {
        $session = ScreeningSession::with([
            'result.doctor',
            'sessionAnswers.question.parameter',
            'sessionAnswers.answer'
        ])->findOrFail($sessionId);

        $result = $session->result;
        if (!$result) {
            throw new Exception("Result not found for this session. It might not be finished.");
        }

        $formattedAnswers = [];
        foreach ($session->sessionAnswers as $sa) {
            $formattedAnswers[] = [
                'parameter' => $sa->question->parameter->name ?? '',
                'question' => $sa->question->question ?? '',
                'answer' => $sa->answer->answer ?? '',
                'score' => $sa->score,
                'severity' => $sa->answer->severity_color ?? '',
            ];
        }

        return [
            'session_id' => $session->id,
            'total_score' => $result->total_score,
            'highest_score' => $result->highest_score,
            'classification' => $result->classification,
            'recommendation' => $result->recommendation,
            'status' => $result->status,
            'doctor_id' => $result->doctor_id,
            'doctor_name' => $result->doctor ? $result->doctor->name : null,
            'doctor_notes' => $result->doctor_notes,
            'reviewed_at' => $result->reviewed_at,
            'answers' => $formattedAnswers,
        ];
    }

    public function updateParameter($id, array $data): ScreeningParameter
    {
        $parameter = ScreeningParameter::findOrFail($id);
        $parameter->update([
            'name' => $data['name'] ?? $parameter->name,
            'order_number' => $data['order_number'] ?? $parameter->order_number,
        ]);
        return $parameter;
    }

    public function deleteParameter($id): void
    {
        $parameter = ScreeningParameter::findOrFail($id);
        $parameter->delete();
    }

    public function updateQuestion($id, array $data): ScreeningQuestion
    {
        $question = ScreeningQuestion::findOrFail($id);
        $question->update([
            'question' => $data['question'] ?? $question->question,
        ]);
        return $question;
    }

    public function deleteQuestion($id): void
    {
        $question = ScreeningQuestion::findOrFail($id);
        $question->delete();
    }

    public function updateAnswer($id, array $data): ScreeningAnswer
    {
        $answer = ScreeningAnswer::findOrFail($id);
        $answer->update([
            'answer' => $data['answer'] ?? $answer->answer,
            'score' => isset($data['score']) ? $data['score'] : $answer->score,
            'severity_color' => $data['severity_color'] ?? $answer->severity_color,
        ]);
        return $answer;
    }

    public function deleteAnswer($id): void
    {
        $answer = ScreeningAnswer::findOrFail($id);
        $answer->delete();
    }

    public function deleteTemplate($id): void
    {
        $template = ScreeningTemplate::findOrFail($id);
        $template->delete();
    }

    public function approveResult($resultId, $doctorId, $advice): ScreeningResult
    {
        $result = ScreeningResult::findOrFail($resultId);
        $doctor = User::findOrFail($doctorId);

        $result->update([
            'status' => 'APPROVED',
            'doctor_id' => $doctorId,
            'doctor_notes' => $advice,
            'reviewed_at' => now(),
        ]);

        // Find participant user ID
        $session = ScreeningSession::findOrFail($result->session_id);

        // Notify client
        \App\Models\Notification::create([
            'user_id' => $session->participant_id,
            'message' => "Dokter {$doctor->name} telah menyetujui screening M-EWS Anda dan memberikan saran: \"{$advice}\"",
            'is_read' => false
        ]);

        return $result;
    }

    public function getNotifications($userId)
    {
        return \App\Models\Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function markNotificationRead($id): void
    {
        $notification = \App\Models\Notification::findOrFail($id);
        $notification->update(['is_read' => true]);
    }
}
