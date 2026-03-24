import { QUERY_KEYS } from '@/configs/query-keys.config';
import { productService } from '@/services/product.service';
import { storageService } from '@/services/storage.service';
import type { ProductListParams } from '@/types/product';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const PRODUCTS_STALE_MS = 30_000;

export function useProducts(
  teamId: string | undefined,
  params: ProductListParams = {},
) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.FILTERED(teamId ?? '', params),
    queryFn: () => productService.fetchProducts(params),
    enabled: Boolean(teamId),
    staleTime: PRODUCTS_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

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
