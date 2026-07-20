<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Form;
use App\Models\Question;
use Illuminate\Support\Facades\DB;

class FormBuilderController extends Controller
{
    // Retrieve all forms
    public function index()
    {
        return response()->json(Form::withCount('questions')->get());
    }

    // Retrieve details of a form with its questions
    public function show($id)
    {
        $form = Form::with(['questions'])->find($id);

        if (!$form) {
            return response()->json(['message' => 'Form tidak ditemukan.'], 404);
        }

        return response()->json($form);
    }

    // Create a new form
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => 'required|in:ONCE,DAILY,BI_WEEKLY,WEEKLY,CONDITIONAL',
            'target_audience' => 'required|array',
            'questions' => 'nullable|array',
            'questions.*.question_code' => 'required|string',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:text,textarea,radio,checkbox,scale',
            'questions.*.options' => 'nullable|array',
            'questions.*.order_number' => 'integer',
            'questions.*.trigger_condition' => 'nullable|array',
            'questions.*.trigger_action_text' => 'nullable|string',
        ]);

        $user = $request->user();

        // Check if user has permission to create form
        if (!$user->hasPermission('create_form')) {
            return response()->json(['message' => 'Unauthorized. Hanya Dokter atau Admin yang dapat membuat form.'], 403);
        }

        DB::beginTransaction();
        try {
            $form = Form::create([
                'title' => $request->title,
                'description' => $request->description,
                'frequency' => $request->frequency,
                'target_audience' => $request->target_audience,
                'created_by' => $user->id,
            ]);

            if ($request->has('questions')) {
                foreach ($request->questions as $qData) {
                    Question::create([
                        'form_id' => $form->id,
                        'question_code' => $qData['question_code'],
                        'text' => $qData['text'],
                        'type' => $qData['type'],
                        'options' => $qData['options'] ?? null,
                        'order_number' => $qData['order_number'] ?? 0,
                        'trigger_condition' => $qData['trigger_condition'] ?? null,
                        'trigger_action_text' => $qData['trigger_action_text'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json($form->load('questions'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat form.', 'error' => $e->getMessage()], 500);
        }
    }

    // Update an existing form
    public function update(Request $request, $id)
    {
        $form = Form::find($id);

        if (!$form) {
            return response()->json(['message' => 'Form tidak ditemukan.'], 404);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => 'required|in:ONCE,DAILY,BI_WEEKLY,WEEKLY,CONDITIONAL',
            'target_audience' => 'required|array',
            'questions' => 'nullable|array',
            'questions.*.question_code' => 'required|string',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|in:text,textarea,radio,checkbox,scale',
            'questions.*.options' => 'nullable|array',
            'questions.*.order_number' => 'integer',
            'questions.*.trigger_condition' => 'nullable|array',
            'questions.*.trigger_action_text' => 'nullable|string',
        ]);

        $user = $request->user();

        // Check permission
        if (!$user->hasPermission('edit_form')) {
            return response()->json(['message' => 'Unauthorized. Hanya Dokter atau Admin yang dapat mengubah form.'], 403);
        }

        DB::beginTransaction();
        try {
            $form->update([
                'title' => $request->title,
                'description' => $request->description,
                'frequency' => $request->frequency,
                'target_audience' => $request->target_audience,
            ]);

            // Sync questions: simpler to delete existing ones and re-insert
            $form->questions()->delete();

            if ($request->has('questions')) {
                foreach ($request->questions as $qData) {
                    Question::create([
                        'form_id' => $form->id,
                        'question_code' => $qData['question_code'],
                        'text' => $qData['text'],
                        'type' => $qData['type'],
                        'options' => $qData['options'] ?? null,
                        'order_number' => $qData['order_number'] ?? 0,
                        'trigger_condition' => $qData['trigger_condition'] ?? null,
                        'trigger_action_text' => $qData['trigger_action_text'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json($form->load('questions'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal memperbarui form.', 'error' => $e->getMessage()], 500);
        }
    }

    // Delete a form
    public function destroy(Request $request, $id)
    {
        $form = Form::find($id);

        if (!$form) {
            return response()->json(['message' => 'Form tidak ditemukan.'], 404);
        }

        $user = $request->user();

        // Check permission ( Dokter or Admin )
        if (!$user->hasPermission('edit_form')) {
            return response()->json(['message' => 'Unauthorized. Hanya Dokter atau Admin yang dapat menghapus form.'], 403);
        }

        $form->delete();
        return response()->json(['message' => 'Form berhasil dihapus.']);
    }
}
