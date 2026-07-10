<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screening_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('screening_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('screening_templates')->onDelete('cascade');
            $table->string('name');
            $table->integer('order_number');
            $table->timestamps();
        });

        Schema::create('screening_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parameter_id')->constrained('screening_parameters')->onDelete('cascade');
            $table->text('question');
            $table->timestamps();
        });

        Schema::create('screening_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('screening_questions')->onDelete('cascade');
            $table->string('answer');
            $table->integer('score');
            $table->enum('severity_color', ['GREEN', 'YELLOW', 'RED']);
            $table->timestamps();
        });

        Schema::create('screening_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('template_id')->constrained('screening_templates')->onDelete('cascade');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });

        Schema::create('screening_session_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('screening_sessions')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('screening_questions')->onDelete('cascade');
            $table->foreignId('answer_id')->constrained('screening_answers')->onDelete('cascade');
            $table->integer('score');
            $table->timestamps();
        });

        Schema::create('screening_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('screening_sessions')->onDelete('cascade');
            $table->integer('total_score');
            $table->integer('highest_score');
            $table->string('classification');
            $table->text('recommendation');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screening_results');
        Schema::dropIfExists('screening_session_answers');
        Schema::dropIfExists('screening_sessions');
        Schema::dropIfExists('screening_answers');
        Schema::dropIfExists('screening_questions');
        Schema::dropIfExists('screening_parameters');
        Schema::dropIfExists('screening_templates');
    }
};
