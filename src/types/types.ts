export interface JwtPayload {
  userId: number;
  role: string;
}

export interface Profile {
  avatar_url: string | null;
  description: string | null;
  about: string | null;
}

export interface PostCreateInput {
  authorId: number;
  title: string;
  code: string;
  languageId: number;
  description?: string | null;
  about?: string | null;
  tags?: string[];
}

export interface PostUpdateInput {
  title?: string | null | undefined;
  code?: string | null | undefined;
  languageId?: number | null | undefined;
  description?: string | null | undefined;
  about?: string | null | undefined;
  tags?: string[] | undefined;
}