<?php

require_once 'vendor/autoload.php';

echo "=== MIGRATING DATA FROM SQLITE TO MYSQL ===\n\n";

// Load Laravel app
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Translation;
use App\Models\User;
use App\Models\File;
use Illuminate\Support\Facades\DB;

try {
    // First, let's connect to SQLite to get the data
    $sqliteConfig = [
        'driver' => 'sqlite',
        'database' => database_path('database.sqlite'),
        'prefix' => '',
    ];
    
    config(['database.connections.sqlite_source' => $sqliteConfig]);
    
    // Get data from SQLite
    echo "Reading data from SQLite...\n";
    $sqliteTranslations = DB::connection('sqlite_source')->table('translations')->get();
    $sqliteUsers = DB::connection('sqlite_source')->table('users')->get();
    $sqliteFiles = DB::connection('sqlite_source')->table('files')->get();
    
    echo "Found " . $sqliteTranslations->count() . " translations in SQLite\n";
    echo "Found " . $sqliteUsers->count() . " users in SQLite\n";
    echo "Found " . $sqliteFiles->count() . " files in SQLite\n\n";
    
    // Start transaction
    DB::beginTransaction();
    
    try {
        // Clear existing data in MySQL (optional)
        echo "Clearing existing MySQL data...\n";
        DB::table('translations')->delete();
        DB::table('files')->delete();
        // Don't delete users as they might be needed for auth
        
        // Migrate Users first (if they don't exist)
        echo "Migrating users...\n";
        foreach ($sqliteUsers as $user) {
            $existingUser = DB::table('users')->where('id', $user->id)->orWhere('email', $user->email)->first();
            if (!$existingUser) {
                DB::table('users')->insert([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'password' => $user->password,
                    'status' => $user->status ?? 'active',
                    'remember_token' => $user->remember_token,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]);
                echo "Migrated user: {$user->email}\n";
            } else {
                echo "User already exists: {$user->email} (ID: {$user->id})\n";
            }
        }
        
        // Migrate Files
        echo "\nMigrating files...\n";
        foreach ($sqliteFiles as $file) {
            // Use INSERT IGNORE to handle duplicates
            DB::statement('INSERT IGNORE INTO files (id, original_name, file_name, file_path, file_size, file_type, user_id, status, source_language, target_language, translation_accuracy, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                $file->id,
                $file->original_name,
                $file->file_name,
                $file->file_path,
                $file->file_size,
                $file->file_type,
                $file->user_id,
                $file->status,
                $file->source_language,
                $file->target_language,
                $file->translation_accuracy,
                $file->metadata,
                $file->created_at,
                $file->updated_at,
            ]);
        }
        echo "Migrated {$sqliteFiles->count()} files\n";
        
        // Migrate Translations
        echo "\nMigrating translations...\n";
        foreach ($sqliteTranslations as $translation) {
            // Use INSERT IGNORE to handle duplicates
            DB::statement('INSERT IGNORE INTO translations (id, user_id, original_text, translated_text, source_language, target_language, file_name, file_type, file_size, status, metadata, file_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                $translation->id,
                $translation->user_id,
                $translation->original_text,
                $translation->translated_text,
                $translation->source_language,
                $translation->target_language,
                $translation->file_name,
                $translation->file_type,
                $translation->file_size,
                $translation->status,
                $translation->metadata,
                $translation->file_id ?? null,
                $translation->created_at,
                $translation->updated_at,
            ]);
        }
        echo "Migrated {$sqliteTranslations->count()} translations\n";
        
        // Commit transaction
        DB::commit();
        
        echo "\n=== MIGRATION COMPLETED SUCCESSFULLY ===\n";
        echo "Your data has been migrated from SQLite to MySQL!\n";
        echo "You can now use MySQL Workbench to query: SELECT * FROM docu_translate.translations;\n\n";
        
        // Verify the migration
        echo "Verification:\n";
        echo "MySQL Translations count: " . DB::table('translations')->count() . "\n";
        echo "MySQL Users count: " . DB::table('users')->count() . "\n";
        echo "MySQL Files count: " . DB::table('files')->count() . "\n";
        
    } catch (Exception $e) {
        DB::rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Migration failed!\n";
}
