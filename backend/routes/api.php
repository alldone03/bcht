<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\FormBuilderController;
use App\Http\Controllers\FormResponseController;

// --- AUTHENTICATION ENDPOINTS ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- ADMIN USER MANAGEMENT ---
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);


    // --- CHAT SESSION & LLM INTEGRATION ---
    Route::get('/chat/sessions', [ChatController::class, 'getSessions']);
    Route::post('/chat/sessions', [ChatController::class, 'createSession']);
    Route::delete('/chat/sessions/{id}', [ChatController::class, 'deleteSession']);
    Route::get('/chat/sessions/{id}/messages', [ChatController::class, 'getMessages']);
    Route::post('/chat/sessions/{id}/messages', [ChatController::class, 'sendMessage']);
    Route::get('/chat/status', [ChatController::class, 'checkLlmStatus']);
    Route::get('/chat/supervision/sessions', [ChatController::class, 'getAllSessionsForDoctor']);
    Route::post('/chat/supervision/sessions', [ChatController::class, 'createSessionForDoctor']);
    Route::delete('/chat/supervision/sessions/{id}', [ChatController::class, 'deleteSessionForDoctor']);
    Route::get('/chat/supervision/sessions/{id}/messages', [ChatController::class, 'getSessionMessagesForDoctor']);
    Route::post('/chat/supervision/sessions/{id}/messages', [ChatController::class, 'sendMessageForDoctor']);
    Route::put('/chat/supervision/messages/{id}', [ChatController::class, 'updateMessageForDoctor']);
    Route::delete('/chat/supervision/messages/{id}', [ChatController::class, 'deleteMessageForDoctor']);

    // --- DYNAMIC FORM BUILDER & RESPONSE ENDPOINTS ---
    Route::get('/forms', [FormBuilderController::class, 'index']);
    Route::get('/forms/{id}', [FormBuilderController::class, 'show']);
    Route::post('/forms', [FormBuilderController::class, 'store']);
    Route::put('/forms/{id}', [FormBuilderController::class, 'update']);
    Route::delete('/forms/{id}', [FormBuilderController::class, 'destroy']);

    Route::get('/form-responses', [FormResponseController::class, 'index']);
    Route::get('/form-responses/{id}', [FormResponseController::class, 'show']);
    Route::post('/form-responses', [FormResponseController::class, 'submit']);
    Route::post('/form-responses/{id}/diagnosis', [FormResponseController::class, 'addDiagnosis']);
});
