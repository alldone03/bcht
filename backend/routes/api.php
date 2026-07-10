<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MewsScreeningController;
use App\Http\Controllers\ChatController;

// --- AUTHENTICATION ENDPOINTS ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- ADMIN USER MANAGEMENT ---
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // --- NOTIFICATION ENDPOINTS ---
    Route::get('/mews/notifications', [MewsScreeningController::class, 'getNotifications']);
    Route::put('/mews/notifications/{id}/read', [MewsScreeningController::class, 'markNotificationRead']);

    // --- APPROVAL ENDPOINTS ---
    Route::post('/mews/results/{id}/approve', [MewsScreeningController::class, 'approveResult']);

    // --- MEWS SCREENING MODULE ENDPOINTS ---
    Route::get('/mews/templates', [MewsScreeningController::class, 'getTemplates']);
    Route::get('/mews/templates/{id}', [MewsScreeningController::class, 'getTemplateDetails']);
    Route::post('/mews/templates', [MewsScreeningController::class, 'createTemplate']);
    Route::put('/mews/templates/{id}', [MewsScreeningController::class, 'updateTemplate']);
    Route::delete('/mews/templates/{id}', [MewsScreeningController::class, 'deleteTemplate']);
    Route::post('/mews/parameters', [MewsScreeningController::class, 'createParameter']);
    Route::put('/mews/parameters/{id}', [MewsScreeningController::class, 'updateParameter']);
    Route::delete('/mews/parameters/{id}', [MewsScreeningController::class, 'deleteParameter']);
    Route::post('/mews/questions', [MewsScreeningController::class, 'createQuestion']);
    Route::put('/mews/questions/{id}', [MewsScreeningController::class, 'updateQuestion']);
    Route::delete('/mews/questions/{id}', [MewsScreeningController::class, 'deleteQuestion']);
    Route::post('/mews/answers', [MewsScreeningController::class, 'createAnswer']);
    Route::put('/mews/answers/{id}', [MewsScreeningController::class, 'updateAnswer']);
    Route::delete('/mews/answers/{id}', [MewsScreeningController::class, 'deleteAnswer']);
    Route::post('/mews/sessions/start', [MewsScreeningController::class, 'startSession']);
    Route::post('/mews/sessions/{id}/submit', [MewsScreeningController::class, 'submitAnswer']);
    Route::post('/mews/sessions/{id}/finish', [MewsScreeningController::class, 'finishSession']);
    Route::get('/mews/sessions/{id}/result', [MewsScreeningController::class, 'getResult']);
    Route::get('/mews/results', [MewsScreeningController::class, 'getAllResults']);

    // --- CHAT SESSION & LLM INTEGRATION ---
    Route::get('/chat/sessions', [ChatController::class, 'getSessions']);
    Route::post('/chat/sessions', [ChatController::class, 'createSession']);
    Route::delete('/chat/sessions/{id}', [ChatController::class, 'deleteSession']);
    Route::get('/chat/sessions/{id}/messages', [ChatController::class, 'getMessages']);
    Route::post('/chat/sessions/{id}/messages', [ChatController::class, 'sendMessage']);
});
