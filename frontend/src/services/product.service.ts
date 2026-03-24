import { supabase } from '@/lib/client';
import type {
  Product,
  ProductListParams,
  ProductListResponse,
  ProductStatus,
} from '@/types/product';
import type { SupabaseClient } from '@supabase/supabase-js';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function throwProductFailure(error: unknown, data: unknown): never {
  if (isRecord(data) && typeof data.error === 'string') {
    throw new Error(data.error);
  }
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'FunctionsHttpError'
  ) {
    const ctx = (error as { context?: unknown }).context;
    if (isRecord(ctx)) {
      const body = ctx.body;
      const parsed: unknown =
        typeof body === 'string'
          ? (() => {
              try {
                return JSON.parse(body);
              } catch {
                return null;
              }
            })()
          : body;
      if (isRecord(parsed) && typeof parsed.error === 'string') {
        throw new Error(parsed.error);
      }
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: string }).message;
    if (typeof msg === 'string' && msg.length > 0) throw new Error(msg);
  }
  throw new Error('Request failed');
}

class ProductService {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async userAuthHeaders(): Promise<{ Authorization: string }> {
    const { error: userError } = await this.client.auth.getUser();
    if (userError) throw userError;

    const {
      data: { session },
      error,
    } = await this.client.auth.getSession();
    if (error) throw error;

    const token = session?.access_token;
    if (!token) {
      throw new Error('No session access token — sign in again.');
    }

    return { Authorization: `Bearer ${token}` };
  }

  async fetchProducts(
    params: ProductListParams = {},
  ): Promise<ProductListResponse> {
    const headers = await this.userAuthHeaders();

    const qs = new URLSearchParams();
    if (params.page != null) qs.set('page', String(params.page));
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);
    if (params.search?.trim()) qs.set('search', params.search.trim());
    if (params.createdBy) qs.set('createdBy', params.createdBy);
    if (params.sortBy) qs.set('sortBy', params.sortBy);
    if (params.sortOrder) qs.set('sortOrder', params.sortOrder);

    const fnName =
      qs.size > 0 ? `products-fetch?${qs.toString()}` : 'products-fetch';

    const { data, error } =
      await this.client.functions.invoke<ProductListResponse>(fnName, {
        method: 'GET',
        headers,
      });

    if (error || !data) throwProductFailure(error, data);
    return data!;
  }

  async getProduct(productId: string): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) throw error;
    return data as Product;
  }

  async updateProductStatus(
    productId: string,
    status: ProductStatus,
  ): Promise<Product> {
    const headers = await this.userAuthHeaders();

    const { data, error } = await this.client.functions.invoke<{
      product: Product;
    }>('products-update-status', {
      method: 'PATCH',
      headers,
      body: { productId, status },
    });

    if (error || !data) throwProductFailure(error, data);
    return data!.product;
  }

  async updateProduct(params: {
    productId: string;
    title?: string;
    description?: string;
    imageUrl?: string | null;
  }): Promise<Product> {
    const headers = await this.userAuthHeaders();

    const body: Record<string, unknown> = { productId: params.productId };
    if (params.title !== undefined) body.title = params.title;
    if (params.description !== undefined) body.description = params.description;
    if (Object.hasOwn(params, 'imageUrl')) body.imageUrl = params.imageUrl;

    const { data, error } = await this.client.functions.invoke<{
      product: Product;
    }>('products-update', {
      method: 'PATCH',
      headers,
      body,
    });

    if (error || !data) throwProductFailure(error, data);
    return data!.product;
  }

  async createProduct(params: {
    title: string;
    description?: string;
    imageUrl?: string | null;
  }): Promise<Product> {
    const headers = await this.userAuthHeaders();

    const { data, error } = await this.client.functions.invoke<{
      product: Product;
    }>('products-create', {
      method: 'POST',
      headers,
      body: params,
    });

    if (error || !data) throwProductFailure(error, data);
    return data!.product;
  }
}

export const productService = new ProductService(supabase);
