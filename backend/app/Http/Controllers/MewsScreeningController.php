<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MewsScreeningService;
use App\Models\ScreeningTemplate;
use App\Models\ScreeningSession;
use App\Models\ScreeningResult;
use Illuminate\Support\Facades\Auth;
use Exception;

class MewsScreeningController extends Controller
{
    protected MewsScreeningService $service;

    public function __construct(MewsScreeningService $service)
    {
        $this->service = $service;
    }

    public function getTemplates()
    {
        $templates = ScreeningTemplate::all();
        return response()->json($templates);
    }

    public function getTemplateDetails($id)
    {
        $template = ScreeningTemplate::with(['parameters.question.answers'])->findOrFail($id);
        return response()->json($template);
    }

    public function startSession(Request $request)
    {
        $request->validate([
            'template_id' => 'required|exists:screening_templates,id',
        ]);

        $session = $this->service->startScreening(
            Auth::id() ?? 3, // Fallback to Budi if not logged in (for testing)
            $request->template_id
        );

        return response()->json([
            'message' => 'Screening session started successfully.',
            'session_id' => $session->id,
        ], 201);
    }

    public function submitAnswer(Request $request, $sessionId)
    {
        $request->validate([
            'question_id' => 'required|exists:screening_questions,id',
            'answer_id' => 'required|exists:screening_answers,id',
        ]);

        $sessionAnswer = $this->service->submitAnswer(
            $sessionId,
            $request->question_id,
            $request->answer_id
        );

        return response()->json([
            'message' => 'Answer submitted successfully.',
            'answer' => $sessionAnswer,
        ]);
    }

    public function finishSession($sessionId)
    {
        try {
            $calculated = $this->service->calculateResult($sessionId);
            $result = $this->service->saveResult($sessionId, $calculated);
            $formattedResult = $this->service->getResult($sessionId);

            return response()->json($formattedResult);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to finish screening session.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function getResult($sessionId)
    {
        try {
            $formattedResult = $this->service->getResult($sessionId);
            return response()->json($formattedResult);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve result.',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function getAllResults()
    {
        $user = Auth::user();
        if ($user && $user->role === 'PESERTA') {
            $sessions = ScreeningSession::where('participant_id', $user->id)
                ->whereNotNull('finished_at')
                ->with(['template', 'result.doctor'])
                ->get();
        } else {
            $sessions = ScreeningSession::whereNotNull('finished_at')
                ->with(['template', 'result.doctor', 'participant'])
                ->get();
        }

        $formatted = $sessions->map(function ($session) {
            return [
                'session_id' => $session->id,
                'result_id' => $session->result->id ?? null,
                'participant_name' => $session->participant->name ?? 'Pasien',
                'template_name' => $session->template->name ?? 'Screening',
                'total_score' => $session->result->total_score ?? 0,
                'highest_score' => $session->result->highest_score ?? 0,
                'classification' => $session->result->classification ?? 'N/A',
                'recommendation' => $session->result->recommendation ?? '',
                'status' => $session->result->status ?? 'PENDING',
                'doctor_id' => $session->result->doctor_id ?? null,
                'doctor_name' => $session->result->doctor->name ?? null,
                'doctor_notes' => $session->result->doctor_notes ?? null,
                'reviewed_at' => $session->result->reviewed_at ?? null,
                'finished_at' => $session->finished_at,
            ];
        });

        return response()->json($formatted);
    }

    public function createTemplate(Request $request)
    {
        $user = Auth::user();
        if ($user && $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parameters' => 'required|array',
            'parameters.*.name' => 'required|string',
            'parameters.*.order_number' => 'required|integer',
            'parameters.*.question' => 'required|string',
            'parameters.*.answers' => 'required|array',
            'parameters.*.answers.*.answer' => 'required|string',
            'parameters.*.answers.*.score' => 'required|integer|min:0|max:2',
            'parameters.*.answers.*.severity_color' => 'required|in:GREEN,YELLOW,RED',
        ]);

        try {
            $template = $this->service->createTemplate([
                'name' => $request->name,
                'description' => $request->description,
            ]);

            foreach ($request->parameters as $pData) {
                $parameter = $this->service->createParameter([
                    'template_id' => $template->id,
                    'name' => $pData['name'],
                    'order_number' => $pData['order_number'],
                ]);

                $question = $this->service->createQuestion([
                    'parameter_id' => $parameter->id,
                    'question' => $pData['question'],
                ]);

                foreach ($pData['answers'] as $ansData) {
                    $this->service->createAnswer([
                        'question_id' => $question->id,
                        'answer' => $ansData['answer'],
                        'score' => $ansData['score'],
                        'severity_color' => $ansData['severity_color'],
                    ]);
                }
            }

            return response()->json([
                'message' => 'Template created successfully.',
                'template_id' => $template->id,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to create template.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateTemplate(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $template = \App\Models\ScreeningTemplate::findOrFail($id);
        $template->update($request->only(['name', 'description']));
        return response()->json($template);
    }

    public function createParameter(Request $request)
    {
        $request->validate([
            'template_id' => 'required|exists:screening_templates,id',
            'name' => 'required|string|max:255',
            'order_number' => 'required|integer',
        ]);
        $param = $this->service->createParameter($request->all());
        return response()->json($param, 201);
    }

    public function updateParameter(Request $request, $id)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'order_number' => 'nullable|integer',
        ]);
        $param = $this->service->updateParameter($id, $request->all());
        return response()->json($param);
    }

    public function deleteParameter($id)
    {
        $this->service->deleteParameter($id);
        return response()->json(['message' => 'Parameter deleted successfully']);
    }

    public function createQuestion(Request $request)
    {
        $request->validate([
            'parameter_id' => 'required|exists:screening_parameters,id',
            'question' => 'required|string',
        ]);
        $question = $this->service->createQuestion($request->all());
        return response()->json($question, 201);
    }

    public function updateQuestion(Request $request, $id)
    {
        $request->validate([
            'question' => 'required|string',
        ]);
        $question = $this->service->updateQuestion($id, $request->all());
        return response()->json($question);
    }

    public function deleteQuestion($id)
    {
        $this->service->deleteQuestion($id);
        return response()->json(['message' => 'Question deleted successfully']);
    }

    public function createAnswer(Request $request)
    {
        $request->validate([
            'question_id' => 'required|exists:screening_questions,id',
            'answer' => 'required|string',
            'score' => 'required|integer|min:0|max:2',
            'severity_color' => 'required|in:GREEN,YELLOW,RED',
        ]);
        $answer = $this->service->createAnswer($request->all());
        return response()->json($answer, 201);
    }

    public function updateAnswer(Request $request, $id)
    {
        $request->validate([
            'answer' => 'nullable|string',
            'score' => 'nullable|integer|min:0|max:2',
            'severity_color' => 'nullable|in:GREEN,YELLOW,RED',
        ]);
        $answer = $this->service->updateAnswer($id, $request->all());
        return response()->json($answer);
    }

    public function deleteAnswer($id)
    {
        $this->service->deleteAnswer($id);
        return response()->json(['message' => 'Answer deleted successfully']);
    }

    public function deleteTemplate($id)
    {
        $this->service->deleteTemplate($id);
        return response()->json(['message' => 'Template deleted successfully']);
    }

    public function approveResult(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user || $user->role === 'PESERTA') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'doctor_notes' => 'required|string',
        ]);

        $result = $this->service->approveResult($id, $user->id, $request->doctor_notes);
        return response()->json($result);
    }

    public function getNotifications(Request $request)
    {
        $user = Auth::user();
        $notifications = $this->service->getNotifications($user->id);
        return response()->json($notifications);
    }

    public function markNotificationRead(Request $request, $id)
    {
        $this->service->markNotificationRead($id);
        return response()->json(['message' => 'Notification marked as read']);
    }
}
