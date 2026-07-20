<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Roles Table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->timestamps();
        });

        // 2. Create Permissions Table
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->timestamps();
        });

        // 3. Create Role-Permission Pivot Table
        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->primary(['role_id', 'permission_id']);
        });

        // 4. Create Teams Table
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->timestamps();
        });

        // 5. Update Users Table with Role ID and Team ID
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->constrained('roles')->onDelete('set null');
            $table->foreignId('team_id')->nullable()->constrained('teams')->onDelete('set null');
        });

        // 6. Create Forms Table
        Schema::create('forms', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('frequency', ['ONCE', 'DAILY', 'BI_WEEKLY', 'WEEKLY', 'CONDITIONAL'])->default('ONCE');
            $table->json('target_audience')->nullable(); // list of roles allowed to fill, e.g. ["PESERTA"]
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        // 7. Create Questions Table
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained('forms')->onDelete('cascade');
            $table->string('question_code');
            $table->text('text');
            $table->enum('type', ['text', 'textarea', 'radio', 'checkbox', 'scale']);
            $table->json('options')->nullable(); // for radio/checkbox choices
            $table->integer('order_number')->default(0);
            $table->json('trigger_condition')->nullable(); // e.g. {"depends_on": "A08", "value": "Ya"}
            $table->text('trigger_action_text')->nullable(); // action clinical message e.g. "Catat pemicu..."
            $table->timestamps();
        });

        // 8. Create Form Submissions Table
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained('forms')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // target participant
            $table->foreignId('filled_by')->constrained('users')->onDelete('cascade'); // user who filled the form
            $table->text('diagnosis')->nullable();
            $table->foreignId('diagnosed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('diagnosed_at')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();
        });

        // 9. Create Answers Table
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('form_submissions')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->text('answer_value'); // can be string or JSON
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('answers');
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('forms');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['users_role_id_foreign']);
            $table->dropForeign(['users_team_id_foreign']);
            $table->dropColumn(['role_id', 'team_id']);
        });

        Schema::dropIfExists('teams');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
