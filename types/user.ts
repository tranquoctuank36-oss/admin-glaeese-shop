// types/user.ts

export type UUID = string;

export type UserRole = string;
export type UserStatus = string;
export type Gender = "male" | "female" | "other" | null;

export interface User {
  id: UUID;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string;
  gender?: Gender;
  dateOfBirth?: string | null;
  roles: UserRole[];
  status: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type CreateUserPayload = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  role?: UserRole;
  status?: UserStatus;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;
