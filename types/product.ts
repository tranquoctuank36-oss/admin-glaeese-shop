
export type UUID = string;

export type Gender = "male" | "female" | "unisex" | "kid";  // lowercase để match API
export type ProductType = "frame" | "sunglasses";  // lowercase để match API

export interface IdNameSlug {
  id: UUID;
  name: string;
  slug: string;
}

export interface Brand extends IdNameSlug {
  websiteUrl?: string | null;
  description?: string | null;
  bannerImagePublicUrl?: string | null;
  bannerImageAltText?: string | null;
}

export interface ProductColor extends IdNameSlug {
  hexCode?: string | null;
}

export interface ProductImage {
  id: UUID;
  publicUrl: string;
  altText?: string | null;
  sortOrder?: number | null;
}

export interface ProductVariant {
  id: UUID;
  name: string;
  sku: string;
  quantityAvailable: number;
  finalPrice: string;
  originalPrice?: string;
  isActive?: boolean;
  // isDeleted?: boolean;
  // deletedAt?: string | null;
  colors?: ProductColor[];
  colorIds?: string[];
  productImagesIds?: string[];
  productImages?: ProductImage[]; // Add images array
  thumbnailImage?: ProductImage; // Add thumbnail image
}

export interface  Product {
  id: UUID;
  name: string;
  slug: string;
  description?: string | null;

  productType: ProductType;
  gender: Gender;

  lensWidth?: number | null;
  bridgeWidth?: number | null;
  templeLength?: number | null;
  lensHeight?: number | null;

  frameShape?: IdNameSlug | null;
  frameType?: IdNameSlug | null;
  frameMaterial?: IdNameSlug | null;
  brand?: Brand | null;

  categories?: IdNameSlug[];
  tags?: IdNameSlug[];

  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  totalSold?: number;

  productVariants?: ProductVariant[];
  variants?: ProductVariant[];
  productImages?: ProductImage[];

  sortOrder?: number | null;

  createdAt?: string;
  deletedAt?: string | null;

  productStatus: string | null;
  viewCount: number;
  thumbnailUrl?: string;
}
