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
import { PAGES } from '@/configs/pages.config';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useCreateProduct } from '@/hooks/use-products';
import { useTeamInfo } from '@/hooks/use-team';
import { cn } from '@/lib/utils';
import { type CreateProductFormValues, createProductSchema } from '@/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

export function CreateProduct() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const { data: teamData } = useTeamInfo(user?.id);
  const teamId = teamData?.teams?.id;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProduct = useCreateProduct();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { title: '', description: '' },
  });

  const { field: imageField } = useController({ name: 'image', control });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      imageField.onChange(file);
    } else {
      setPreviewUrl(null);
      imageField.onChange(null);
    }
  }

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = '';
    imageField.onChange(null); // Reset the file input value
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    imageField.onChange(null);
    resetFileInput();
  }

  function handleClose() {
    void navigate(PAGES.APP.HOME);
  }

  async function onSubmit(values: CreateProductFormValues) {
    if (!teamId) {
      setServerError(
        'Team not loaded yet — please wait a moment and try again.',
      );
      return;
    }
    setServerError(null);
    try {
      await createProduct.mutateAsync({
        title: values.title,
        description: values.description,
        image: values.image ?? null,
        teamId,
      });
      void navigate(PAGES.APP.HOME);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogCloseButton />

          <DialogHeader>
            <DialogTitle>New product</DialogTitle>
            <DialogDescription>
              Fill in the details below. The product will be created in{' '}
              <strong>Draft</strong> status.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-4'
            noValidate
          >
            {/* Title */}
            <div className='grid gap-2'>
              <Label htmlFor='product-title'>
                Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='product-title'
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

            {/* Description */}
            <div className='grid gap-2'>
              <Label htmlFor='product-description'>Description</Label>
              <Textarea
                id='product-description'
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

            {/* Image upload */}
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
                    onClick={removeImage}
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
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-sm transition-colors',
                    errors.image
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
                ref={fileInputRef}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/gif'
                aria-label='Product image'
                className='sr-only'
                tabIndex={-1}
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className='size-3.5' />
                  Change image
                </Button>
              ) : null}

              {errors.image ? (
                <p className='text-destructive text-sm' role='alert'>
                  {errors.image.message}
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
                onClick={handleClose}
                disabled={createProduct.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createProduct.isPending}>
                {createProduct.isPending ? 'Creating…' : 'Create product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
