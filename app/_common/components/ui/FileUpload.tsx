'use client';

import * as React from 'react';
import { cn } from '@/app/_common/lib/utils';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onUpload?: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      accept,
      multiple = false,
      maxSize = 5 * 1024 * 1024, // 5MB default
      onUpload,
      className,
      disabled = false,
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const [error, setError] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `Le fichier ${file.name} est trop volumineux (max ${maxSize / 1024 / 1024}MB)`;
      }
      return null;
    };

    const handleFiles = (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles = Array.from(fileList);
      const errors: string[] = [];

      newFiles.forEach((file) => {
        const error = validateFile(file);
        if (error) errors.push(error);
      });

      if (errors.length > 0) {
        setError(errors[0]);
        return;
      }

      setError('');
      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles;
      setFiles(updatedFiles);
      onUpload?.(updatedFiles);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (disabled) return;
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      if (disabled) return;
      setIsDragging(false);
    };

    const removeFile = (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onUpload?.(newFiles);
    };

    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8',
            'flex flex-col items-center justify-center gap-2',
            'cursor-pointer transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            isDragging && !disabled
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Cliquez ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept || 'Tous les fichiers'} (max {maxSize / 1024 / 1024}MB)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {error && <p className="text-sm text-error-600">{error}</p>}

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                  className="p-1 text-gray-400 hover:text-error-600 transition-colors disabled:opacity-50"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;
