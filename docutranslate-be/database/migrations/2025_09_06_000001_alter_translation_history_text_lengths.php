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
        // Use raw SQL to avoid requiring doctrine/dbal for change()
        DB::statement('ALTER TABLE translation_history MODIFY original_text LONGTEXT');
        DB::statement('ALTER TABLE translation_history MODIFY translated_text LONGTEXT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous types (best-effort)
        DB::statement('ALTER TABLE translation_history MODIFY original_text VARCHAR(255)');
        DB::statement('ALTER TABLE translation_history MODIFY translated_text TEXT');
    }
};
