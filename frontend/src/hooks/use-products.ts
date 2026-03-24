import { QUERY_KEYS } from '@/configs/query-keys.config';
import { productService } from '@/services/product.service';
import { storageService } from '@/services/storage.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type CreateProductParams = {
  title: string;
  description?: string;
  image?: File | null;
  teamId: string;
};

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      image,
      teamId,
    }: CreateProductParams) => {
      let imageUrl: string | null = null;

      if (image) {
        imageUrl = await storageService.uploadImage(image, teamId);
      }

      return productService.createProduct({ title, description, imageUrl });
    },
    onSuccess: (_data, { teamId }) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCTS.LIST(teamId),
      });
    },
  });
}
