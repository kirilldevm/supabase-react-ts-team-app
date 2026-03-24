import {
  ProductFormDialog,
  type ProductFormResult,
} from '@/components/products/product-form-dialog';
import { PAGES } from '@/configs/pages.config';
import {
  useProduct,
  useProductImages,
  useUpdateProduct,
} from '@/hooks/use-products';
import { storageService } from '@/services/storage.service';
import { useTeamInfo } from '@/hooks/use-team';
import { useAuthUser } from '@/hooks/use-auth-user';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user } = useAuthUser();
  const { data: teamData } = useTeamInfo(user?.id);
  const teamId = teamData?.teams?.id;

  const {
    data: product,
    isPending: isProductLoading,
    isError: isProductError,
  } = useProduct(id);

  const { data: imagesMap, isPending: isImageLoading } = useProductImages(
    product ? [product] : [],
  );
  const existingImagePreviewUrl = product?.image_url
    ? (imagesMap?.get(product.image_url) ?? undefined)
    : null;

  const updateProduct = useUpdateProduct();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleClose() {
    if (id) {
      void navigate(PAGES.APP.PRODUCT(id));
    } else {
      void navigate(PAGES.APP.HOME);
    }
  }

  async function handleSubmit({
    title,
    description,
    image,
  }: ProductFormResult) {
    if (!id) return;
    setServerError(null);

    try {
      let imageUrlParam: string | null | undefined = undefined;

      if (image.type === 'remove') {
        imageUrlParam = null;
      } else if (image.type === 'upload') {
        if (!teamId) {
          setServerError('Team not loaded yet — please wait a moment.');
          return;
        }
        imageUrlParam = await storageService.uploadImage(image.file, teamId);
      }

      const params: {
        productId: string;
        title: string;
        description?: string;
        imageUrl?: string | null;
      } = { productId: id, title, description };

      if (imageUrlParam !== undefined) {
        params.imageUrl = imageUrlParam;
      }

      const updated = await updateProduct.mutateAsync(params);
      void navigate(PAGES.APP.PRODUCT(updated.id));
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  }

  // Wait for both product data and its signed URL before showing the form
  const isLoading =
    isProductLoading ||
    (product?.image_url != null && isImageLoading && !imagesMap);

  if (isProductError) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <p className='text-destructive text-sm'>Could not load product.</p>
      </div>
    );
  }

  if (isLoading || !product) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    );
  }

  return (
    <ProductFormDialog
      dialogTitle='Edit product'
      dialogDescription={
        <>
          Update the fields below. Only <strong>Draft</strong> products can be
          edited.
        </>
      }
      submitLabel='Save changes'
      submittingLabel='Saving…'
      defaultTitle={product.title}
      defaultDescription={product.description ?? ''}
      existingImagePreviewUrl={existingImagePreviewUrl}
      isPending={updateProduct.isPending}
      serverError={serverError}
      onClose={handleClose}
      onSubmit={(result) => void handleSubmit(result)}
    />
  );
}
