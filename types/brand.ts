import { ImageItem } from './image';
export type Brand = {
  id: string;
  name: string;
  slug: string;
  brandStatus: string;
  isActive: boolean;
  websiteUrl?: string;
  description?: string;
  bannerImageId?: string;
  bannerImage?: ImageItem;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  priority?: number;
};
