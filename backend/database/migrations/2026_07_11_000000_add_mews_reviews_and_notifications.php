<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Alter screening_results table
        Schema::table('screening_results', function (Blueprint $table) {
            $table->string('status')->default('PENDING');
            $table->foreignId('doctor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->text('doctor_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
        });

        // 2. Create notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');

        Schema::table('screening_results', function (Blueprint $table) {
            $table->dropColumn(['status', 'doctor_id', 'doctor_notes', 'reviewed_at']);
        });
    }
};
