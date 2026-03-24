export type ProductStatus = 'draft' | 'active' | 'deleted';

export type Product = {
  id: string;
  team_id: string;
  title: string;
  description: string;
  image_url: string | null;
  status: ProductStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProductSortBy = 'created_at' | 'updated_at';
export type ProductSortOrder = 'asc' | 'desc';

export type ProductListParams = {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  search?: string;
  createdBy?: string;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
};

export type ProductListResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
