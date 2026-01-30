<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;

class DatabaseBackupService
{
    protected $backupPath;
    protected $databaseName;
    protected $databaseHost;
    protected $databasePort;
    protected $databaseUsername;
    protected $databasePassword;

    public function __construct()
    {
        $this->backupPath = storage_path('app/backups');
        $this->databaseName = config('database.connections.mysql.database');
        $this->databaseHost = config('database.connections.mysql.host');
        $this->databasePort = config('database.connections.mysql.port');
        $this->databaseUsername = config('database.connections.mysql.username');
        $this->databasePassword = config('database.connections.mysql.password');

        // Create backup directory if it doesn't exist
        if (!file_exists($this->backupPath)) {
            mkdir($this->backupPath, 0755, true);
        }
    }

    /**
     * Create a database backup using mysqldump
     */
    public function createBackup()
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $filename = "backup_{$this->databaseName}_{$timestamp}.sql";
            $filepath = $this->backupPath . '/' . $filename;

            // Build mysqldump command
            $command = $this->buildMysqldumpCommand($filepath);

            // Execute the command
            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new Exception("mysqldump failed with return code: {$returnCode}");
            }

            // Check if file was created and has content
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                throw new Exception("Backup file was not created or is empty");
            }

            // Log successful backup
            Log::info("Database backup created successfully: {$filename}", [
                'filepath' => $filepath,
                'size' => $this->formatBytes(filesize($filepath)),
                'timestamp' => $timestamp
            ]);

            return [
                'success' => true,
                'filename' => $filename,
                'filepath' => $filepath,
                'size' => $this->formatBytes(filesize($filepath)),
                'timestamp' => $timestamp
            ];
        } catch (Exception $e) {
            Log::error("Database backup failed: " . $e->getMessage(), [
                'database' => $this->databaseName,
                'host' => $this->databaseHost,
                'port' => $this->databasePort
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Build the mysqldump command
     */
    protected function buildMysqldumpCommand($filepath)
    {
        // Use full path for Windows/Laragon
        $command = 'C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqldump.exe';

        // Add connection parameters
        if ($this->databaseHost && $this->databaseHost !== '127.0.0.1') {
            $command .= " -h {$this->databaseHost}";
        }

        if ($this->databasePort && $this->databasePort !== '3306') {
            $command .= " -P {$this->databasePort}";
        }

        if ($this->databaseUsername) {
            $command .= " -u {$this->databaseUsername}";
        }

        if ($this->databasePassword) {
            $command .= " -p{$this->databasePassword}";
        }

        // Add database name and output file
        $command .= " --single-transaction --routines --triggers --add-drop-table";
        $command .= " {$this->databaseName} > \"{$filepath}\"";

        return $command;
    }

    /**
     * Get list of available backups
     */
    public function getBackups()
    {
        $backups = [];

        if (file_exists($this->backupPath)) {
            $files = glob($this->backupPath . '/backup_*.sql');

            foreach ($files as $file) {
                $backups[] = [
                    'filename' => basename($file),
                    'filepath' => $file,
                    'size' => $this->formatBytes(filesize($file)),
                    'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                    'download_url' => route('profile.database.backup.download', ['filename' => basename($file)])
                ];
            }

            // Sort by creation date (newest first)
            usort($backups, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
        }

        return $backups;
    }

    /**
     * Delete a backup file
     */
    public function deleteBackup($filename)
    {
        try {
            $filepath = $this->backupPath . '/' . $filename;

            if (file_exists($filepath) && unlink($filepath)) {
                Log::info("Backup file deleted: {$filename}");
                return ['success' => true];
            } else {
                throw new Exception("Failed to delete backup file");
            }
        } catch (Exception $e) {
            Log::error("Failed to delete backup: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Format bytes to human readable format
     */
    protected function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Get backup directory path
     */
    public function getBackupPath()
    {
        return $this->backupPath;
    }
}
