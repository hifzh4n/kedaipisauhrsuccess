<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Services\DatabaseBackupService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $backupService = new DatabaseBackupService();
        $databaseBackups = $backupService->getBackups();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'databaseBackups' => $databaseBackups,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Create a new database backup
     */
    public function createDatabaseBackup(Request $request): RedirectResponse
    {
        $backupService = new DatabaseBackupService();
        $result = $backupService->createBackup();

        if ($result['success']) {
            return Redirect::route('profile.edit')->with('success', 'Database backup created successfully: ' . $result['filename']);
        } else {
            return Redirect::route('profile.edit')->with('error', 'Failed to create database backup: ' . $result['error']);
        }
    }

    /**
     * Download a database backup file
     */
    public function downloadDatabaseBackup(Request $request, string $filename): BinaryFileResponse
    {
        $backupService = new DatabaseBackupService();
        $filepath = $backupService->getBackupPath() . '/' . $filename;

        if (!file_exists($filepath)) {
            abort(404, 'Backup file not found');
        }

        return response()->download($filepath, $filename, [
            'Content-Type' => 'application/sql',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }

    /**
     * Delete a database backup file
     */
    public function deleteDatabaseBackup(Request $request, string $filename): RedirectResponse
    {
        $backupService = new DatabaseBackupService();
        $result = $backupService->deleteBackup($filename);

        if ($result['success']) {
            return Redirect::route('profile.edit')->with('success', 'Backup file deleted successfully');
        } else {
            return Redirect::route('profile.edit')->with('error', 'Failed to delete backup file: ' . $result['error']);
        }
    }

    /**
     * Get list of available database backups
     */
    public function getDatabaseBackups(Request $request): Response
    {
        $backupService = new DatabaseBackupService();
        $backups = $backupService->getBackups();

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'databaseBackups' => $backups,
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
