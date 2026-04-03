import { CommentNode } from "../types/comment";

export function buildTree(
  comments: CommentNode[],
  parentId: number | null = null,
  depth: number = 0,
  maxDepth: number = 3
): CommentNode[] {
  if (depth >= maxDepth) return [];

  return comments
    .filter(c => c.parent_id === parentId)
    .map(c => ({
      ...c,
      replies: buildTree(comments, c.id, depth + 1, maxDepth),
    }));
}
