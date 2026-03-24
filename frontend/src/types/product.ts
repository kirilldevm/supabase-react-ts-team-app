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
