<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Form;
use App\Models\Question;
use App\Models\FormSubmission;
use App\Models\Answer;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FormResponseController extends Controller
{
    // Retrieve list of submissions (based on role RBAC constraints)
    public function index(Request $request)
    {
        $user = $request->user();
        $query = FormSubmission::with(['form', 'user', 'filler', 'diagnosedBy']);

        if ($user->hasPermission('view_all_responses')) {
            // Doctors, Admin, Health Team can view all responses
        } elseif ($user->hasRole('PENANGGUNG_JAWAB_TIM')) {
            // Coordinator can view their team's responses
            $teamId = $user->team_id;
            if ($teamId) {
                $query->whereHas('user', function ($q) use ($teamId) {
                    $q->where('team_id', $teamId);
                });
            } else {
                return response()->json([]);
            }
        } else {
            // Peserta can only view their own responses
            $query->where('user_id', $user->id);
        }

        return response()->json($query->orderBy('submitted_at', 'desc')->get());
    }

    // Retrieve details of a specific submission
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $submission = FormSubmission::with(['form', 'user', 'filler', 'diagnosedBy', 'answers.question'])->find($id);

        if (!$submission) {
            return response()->json(['message' => 'Jawaban form tidak ditemukan.'], 404);
        }

        // RBAC validation
        if ($user->hasPermission('view_all_responses')) {
            // Allowed
        } elseif ($user->hasRole('PENANGGUNG_JAWAB_TIM')) {
            // Check if submission is from the coordinator's team
            if ($submission->user->team_id !== $user->team_id) {
                return response()->json(['message' => 'Unauthorized. Tidak dapat melihat data dari tim lain.'], 403);
            }
        } else {
            // Check if submission belongs to the participant
            if ($submission->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized. Tidak dapat mengakses data milik orang lain.'], 403);
            }
        }

        return response()->json($submission);
    }

    // Submit a form response
    public function submit(Request $request)
    {
        $request->validate([
            'form_id' => 'required|exists:forms,id',
            'user_id' => 'required|exists:users,id', // target participant
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.value' => 'required', // can be string or array (for checkboxes)
        ]);

        $user = $request->user();
        $targetUser = User::find($request->user_id);
        $form = Form::find($request->form_id);

        // RBAC: Check if the logged-in user is allowed to submit for targetUser
        // 1. User is submitting for themselves: allowed if role matches form target
        // 2. User is Teman Pendamping: allowed if they are in the same team as targetUser
        // 3. User is Doctor/Health Team/Admin: allowed
        $isSelf = $user->id === $targetUser->id;
        $isCompanion = false;

        if ($user->team_id && $targetUser->team_id && $user->team_id === $targetUser->team_id && $user->id !== $targetUser->id) {
            // If they are in the same team, user can act as Companion for targetUser
            $isCompanion = true;
        }

        $canSubmit = false;
        if ($user->hasPermission('submit_response')) {
            if ($isSelf) {
                $canSubmit = true;
            } elseif ($isCompanion) {
                $canSubmit = true;
            }
        }

        // Doctor/Admin/Tim Kesehatan can submit for anyone
        if ($user->hasPermission('view_all_responses')) {
            $canSubmit = true;
        }

        if (!$canSubmit) {
            return response()->json(['message' => 'Unauthorized. Anda tidak memiliki hak untuk mengirim form untuk peserta ini.'], 403);
        }

        DB::beginTransaction();
        try {
            $submission = FormSubmission::create([
                'form_id' => $form->id,
                'user_id' => $targetUser->id,
                'filled_by' => $user->id,
                'submitted_at' => now(),
            ]);

            foreach ($request->answers as $ansData) {
                $val = $ansData['value'];
                if (is_array($val)) {
                    $val = json_encode($val); // Store checkbox array as JSON string
                }

                Answer::create([
                    'submission_id' => $submission->id,
                    'question_id' => $ansData['question_id'],
                    'answer_value' => $val,
                ]);
            }

            DB::commit();
            return response()->json([
                'message' => 'Form berhasil dikirim.',
                'submission_id' => $submission->id
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal mengirim form.', 'error' => $e->getMessage()], 500);
        }
    }

    // Doctor inputs diagnosis on a participant's submission
    public function addDiagnosis(Request $request, $id)
    {
        $request->validate([
            'diagnosis' => 'required|string',
        ]);

        $user = $request->user();
        $submission = FormSubmission::find($id);

        if (!$submission) {
            return response()->json(['message' => 'Jawaban form tidak ditemukan.'], 404);
        }

        // Check if user has permission to write diagnosis (Doctor / Health Team)
        if (!$user->hasPermission('write_diagnosis')) {
            return response()->json(['message' => 'Unauthorized. Hanya Dokter atau Tim Kesehatan yang dapat memberikan diagnosa.'], 403);
        }

        $submission->update([
            'diagnosis' => $request->diagnosis,
            'diagnosed_by' => $user->id,
            'diagnosed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Diagnosa berhasil ditambahkan.',
            'submission' => $submission->load(['diagnosedBy'])
        ]);
    }
}
