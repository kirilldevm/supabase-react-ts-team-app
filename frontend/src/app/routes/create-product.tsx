import {
  ProductFormDialog,
  type ProductFormResult,
} from '@/components/products/product-form-dialog';
import { PAGES } from '@/configs/pages.config';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useCreateProduct } from '@/hooks/use-products';
import { useTeamInfo } from '@/hooks/use-team';
import { storageService } from '@/services/storage.service';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function CreateProduct() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const { data: teamData } = useTeamInfo(user?.id);
  const teamId = teamData?.teams?.id;

  const createProduct = useCreateProduct();
  const [serverError, setServerError] = useState<string | null>(null);

  function handleClose() {
    void navigate(PAGES.APP.HOME);
  }

  async function handleSubmit({
    title,
    description,
    image,
  }: ProductFormResult) {
    if (!teamId) {
      setServerError(
        'Team not loaded yet — please wait a moment and try again.',
      );
      return;
    }
    setServerError(null);

    try {
      let imageUrl: string | null = null;

      if (image.type === 'upload') {
        imageUrl = await storageService.uploadImage(image.file, teamId);
      }

      await createProduct.mutateAsync({ title, description, imageUrl, teamId });
      void navigate(PAGES.APP.HOME);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  }

  return (
    <ProductFormDialog
      dialogTitle='New product'
      dialogDescription={
        <>
          Fill in the details below. The product will be created in{' '}
          <strong>Draft</strong> status.
        </>
      }
      submitLabel='Create product'
      submittingLabel='Creating…'
      isPending={createProduct.isPending}
      serverError={serverError}
      onClose={handleClose}
      onSubmit={(result) => void handleSubmit(result)}
    />
  );
}
