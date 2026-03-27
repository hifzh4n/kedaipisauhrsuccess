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
        Schema::table('users', function (Blueprint $table) {
            // Add new columns first
            $table->string('first_name')->after('id');
            $table->string('last_name')->after('first_name');
            $table->enum('role', ['admin', 'staff'])->default('staff')->after('email_verified_at');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('role');
        });

        // Migrate existing data from name to first_name and last_name
        DB::statement("UPDATE users SET first_name = SUBSTRING_INDEX(name, ' ', 1), last_name = TRIM(SUBSTRING(name, LOCATE(' ', name) + 1)) WHERE name IS NOT NULL");

        // Handle cases where there's no space in the name (single name)
        DB::statement("UPDATE users SET last_name = '' WHERE last_name = first_name");

        Schema::table('users', function (Blueprint $table) {
            // Drop the old name column
            $table->dropColumn('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add back the name column
            $table->string('name')->after('id');
        });

        // Migrate data back from first_name and last_name to name
        DB::statement("UPDATE users SET name = CONCAT(first_name, ' ', last_name) WHERE first_name IS NOT NULL");

        Schema::table('users', function (Blueprint $table) {
            // Drop the new columns
            $table->dropColumn(['first_name', 'last_name', 'role', 'status']);
        });
    }
};
