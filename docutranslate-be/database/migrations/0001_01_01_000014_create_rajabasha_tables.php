<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rajabasha_papers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('language')->default('ta');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        Schema::create('rajabasha_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('paper_id');
            $table->text('question_text');
            $table->string('question_type')->default('mcq'); // mcq|short
            $table->json('options')->nullable(); // for mcq
            $table->string('answer_key')->nullable(); // correct answer id/text
            $table->unsignedInteger('marks')->default(1);
            $table->timestamps();
        });

        Schema::create('rajabasha_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('paper_id');
            $table->json('answers'); // { [questionId]: userAnswer }
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rajabasha_attempts');
        Schema::dropIfExists('rajabasha_questions');
        Schema::dropIfExists('rajabasha_papers');
    }
}; 