type CategoryLevel = 0 | 1 | 2 | 3 | 4 | 5;

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  relativeUrl?: string | null;
  level: CategoryLevel;
  priority: number;
  categoryStatus: string | null;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  children?: Category[]; 
  parent?: Category | null;
};