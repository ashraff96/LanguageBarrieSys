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
        Schema::table('translations', function (Blueprint $table) {
            $table->foreignId('file_id')->nullable()->after('user_id')->constrained()->onDelete('set null');
            $table->index(['file_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('translations', function (Blueprint $table) {
            $table->dropForeign(['file_id']);
            $table->dropIndex(['file_id', 'created_at']);
            $table->dropColumn('file_id');
        });
    }
};
