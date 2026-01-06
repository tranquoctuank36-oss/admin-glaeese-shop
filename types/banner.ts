export type Banner = {
  id: string;
  title: string;
  imageId: string;
  imageUrl: string;
  linkUrl?: {};
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
};
