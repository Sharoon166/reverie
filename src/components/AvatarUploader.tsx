'use client';

import { CircleUserRoundIcon, XIcon } from 'lucide-react';

import { useFileUpload } from '@/hooks/use-file-upload';
import type { FileMetadata } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import Image from 'next/image';

interface AvatarUploaderProps {
  label?: string;
  onFileChange?: (file: File | FileMetadata | null) => void;
}

export default function AvatarUploader({
  label,
  onFileChange,
}: AvatarUploaderProps) {
  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    accept: 'image/*',
    maxFiles: 1,
    maxSize: 3 * 1024 * 1024, // 3MB
  });

  const previewUrl = files[0]?.preview || null;

  useEffect(() => {
    onFileChange?.(files[0]?.file || null);
  }, [files, onFileChange])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex">
        {/* Drop area */}
        <button
          type='button'
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 relative flex size-16 items-center justify-center overflow-hidden rounded-full border border-dashed transition-colors outline-none focus-visible:ring-[3px] has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          aria-label={previewUrl ? 'Change image' : 'Upload image'}
        >
          {previewUrl ? (
            <Image
              className="size-full object-cover"
              src={previewUrl}
              alt={files[0]?.file?.name || 'Uploaded image'}
              width={64}
              height={64}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div aria-hidden="true">
              <CircleUserRoundIcon className="size-4 opacity-60" />
            </div>
          )}
        </button>
        {previewUrl && (
          <Button
            onClick={() => removeFile(files[0]?.id)}
            size="icon"
            className="border-background focus-visible:border-background absolute -top-1 -right-1 size-6 rounded-full border-2 shadow-none"
            aria-label="Remove image"
          >
            <XIcon className="size-3.5" />
          </Button>
        )}
        <input
          {...getInputProps()}
          className="sr-only"
          aria-label="Upload image file"
          tabIndex={-1}
        />
      </div>
      {label && <p className="text-muted-foreground mt-2 text-xs">{label}</p>}
    </div>
  );
}
