import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBackdrop,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { productFormSchema, type ProductFormFields } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

export type ImageAction =
  | { type: 'keep' }
  | { type: 'remove' }
  | { type: 'upload'; file: File };

export type ProductFormResult = {
  title: string;
  description?: string;
  image: ImageAction;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_ATTR = ACCEPTED_TYPES.join(',');

type Props = {
  dialogTitle: string;
  dialogDescription: React.ReactNode;
  submitLabel: string;
  submittingLabel: string;
  defaultTitle?: string;
  defaultDescription?: string;
  existingImagePreviewUrl?: string | null;
  isPending: boolean;
  serverError: string | null;
  onClose: () => void;
  onSubmit: (result: ProductFormResult) => void;
};

export function ProductFormDialog({
  dialogTitle,
  dialogDescription,
  submitLabel,
  submittingLabel,
  defaultTitle = '',
  defaultDescription = '',
  existingImagePreviewUrl,
  isPending,
  serverError,
  onClose,
  onSubmit,
}: Props) {
  const isEditMode = existingImagePreviewUrl !== undefined;

  // ── Image state ─────────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImagePreviewUrl ?? null,
  );
  // Track whether the current previewUrl is a blob URL we need to revoke.
  const previewIsBlobRef = useRef(false);
  const [imageAction, setImageAction] = useState<ImageAction>({ type: 'keep' });
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    return () => {
      if (previewIsBlobRef.current && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function setNewFile(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be smaller than 5 MB');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, WebP and GIF are supported');
      return;
    }
    setImageError(null);

    if (previewIsBlobRef.current && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const blobUrl = URL.createObjectURL(file);
    previewIsBlobRef.current = true;
    setPreviewUrl(blobUrl);
    setImageAction({ type: 'upload', file });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setNewFile(file);
  }

  function handleRemoveImage() {
    if (previewIsBlobRef.current && previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    previewIsBlobRef.current = false;
    setPreviewUrl(null);
    setImageError(null);
    setImageAction(isEditMode ? { type: 'remove' } : { type: 'keep' });
    setFileInputKey((k) => k + 1);
  }

  function handlePickImage() {
    fileInputRef.current?.click();
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormFields>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { title: defaultTitle, description: defaultDescription },
  });

  function handleFormSubmit(fields: ProductFormFields) {
    onSubmit({ ...fields, image: imageAction });
  }

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogCloseButton />

          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className='flex flex-col gap-4'
            noValidate
          >
            {/* ── Title ── */}
            <div className='grid gap-2'>
              <Label htmlFor='pf-title'>
                Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='pf-title'
                placeholder='e.g. Running shoes'
                autoComplete='off'
                aria-invalid={Boolean(errors.title)}
                {...register('title')}
              />
              {errors.title ? (
                <p className='text-destructive text-sm' role='alert'>
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            {/* ── Description ── */}
            <div className='grid gap-2'>
              <Label htmlFor='pf-description'>Description</Label>
              <Textarea
                id='pf-description'
                placeholder='Optional description…'
                rows={3}
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
              {errors.description ? (
                <p className='text-destructive text-sm' role='alert'>
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            {/* ── Image ── */}
            <div className='grid gap-2'>
              <Label>Image</Label>

              {previewUrl ? (
                <div className='relative w-full overflow-hidden rounded-lg border border-border'>
                  <img
                    src={previewUrl}
                    alt='Preview'
                    className='max-h-48 w-full object-contain'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={handleRemoveImage}
                    aria-label='Remove image'
                    className='absolute top-2 right-2 rounded-full p-1 shadow transition-colors hover:bg-background'
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              ) : (
                <button
                  type='button'
                  aria-label='Choose image'
                  onClick={handlePickImage}
                  className={cn(
                    'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm transition-colors',
                    imageError
                      ? 'border-destructive text-destructive'
                      : 'border-input text-muted-foreground hover:border-ring hover:text-foreground',
                  )}
                >
                  <ImagePlus className='size-6 opacity-50' />
                  <span>Click to choose an image</span>
                  <span className='text-xs opacity-60'>
                    JPEG, PNG, WebP or GIF · max 5 MB
                  </span>
                </button>
              )}

              <input
                key={fileInputKey}
                ref={fileInputRef}
                type='file'
                accept={ACCEPTED_ATTR}
                aria-label='Product image file'
                className='sr-only'
                tabIndex={-1}
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handlePickImage}
                >
                  <Upload className='size-3.5' />
                  Change image
                </Button>
              ) : null}

              {imageError ? (
                <p className='text-destructive text-sm' role='alert'>
                  {imageError}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <p className='text-destructive text-sm' role='alert'>
                {serverError}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? submittingLabel : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
