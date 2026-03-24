import { QUERY_KEYS } from '@/configs/query-keys.config';
import { productService } from '@/services/product.service';
import { storageService } from '@/services/storage.service';
import type { Product, ProductListParams, ProductStatus } from '@/types/product';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

const PRODUCTS_STALE_MS = 30_000;
/** Signed URLs expire after 1 h; treat them as fresh for 50 min. */
const IMAGE_STALE_MS = 50 * 60 * 1_000;

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

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.DETAIL(productId ?? ''),
    queryFn: () => productService.getProduct(productId!),
    enabled: Boolean(productId),
    staleTime: 60_000,
  });
}

/**
 * Batch-fetch signed URLs for a list of products that have images.
 * Returns a Map<storagePath, signedUrl>.
 */
export function useProductImages(products: Product[]) {
  const paths = useMemo(
    () =>
      [...new Set(products.map((p) => p.image_url).filter((p): p is string => Boolean(p)))].sort(),
    [products],
  );

  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS.ALL, 'images', paths],
    queryFn: () => storageService.getSignedUrls(paths),
    enabled: paths.length > 0,
    staleTime: IMAGE_STALE_MS,
    gcTime: 55 * 60 * 1_000,
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

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      status,
    }: {
      productId: string;
      status: ProductStatus;
    }) => productService.updateProductStatus(productId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        QUERY_KEYS.PRODUCTS.DETAIL(updated.id),
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRODUCTS.ALL,
      });
    },
  });
}
