<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('original_text');
            $table->text('translated_text');
            $table->string('source_language');
            $table->string('target_language');
            $table->string('file_name')->nullable();
            $table->string('file_type')->nullable();
            $table->bigInteger('file_size')->nullable(); // in bytes
            $table->string('status')->default('completed'); // completed, processing, failed
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable(); // Additional translation metadata
            $table->timestamps();
            
            $table->index(['user_id', 'created_at']);
            $table->index(['source_language', 'target_language']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
}; 