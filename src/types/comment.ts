export interface CommentNode {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  created_at: string;
  parent_id?: number | null;
  replies?: CommentNode[];
}
