import { prisma } from "../../lib/prisma";

export interface SearchResult {
  id: string;
  title: string;
  emoji: string | null;
  excerpt: string;
  workspaceId: string;
  createdById: string;
  updatedAt: string;
}

export const searchDocuments = async (
  workspaceId: string,
  userId: string,
  query: string,
): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  // Verify user is a member of the workspace
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
  });

  if (!member) {
    throw new Error("You do not have access to this workspace");
  }

  // PostgreSQL full-text search using raw query
  // to_tsvector converts text to searchable tokens
  // to_tsquery converts search term to query
  // ts_rank ranks results by relevance
  // ts_headline generates excerpt with highlighted matches
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      id,
      title,
      emoji,
      "updatedAt",
      "workspaceId",
      "createdById",
      ts_headline(
        'english',
        COALESCE(title, ''),
        plainto_tsquery('english', ${query}),
        'MaxWords=15, MinWords=5, ShortWord=3, HighlightAll=false, MaxFragments=1'
      ) as excerpt
    FROM documents
    WHERE
      "workspaceId" = ${workspaceId}
      AND
      to_tsvector('english', COALESCE(title, ''))
      @@ plainto_tsquery('english', ${query})
    ORDER BY
      ts_rank(
        to_tsvector('english', COALESCE(title, '')),
        plainto_tsquery('english', ${query})
      ) DESC
    LIMIT 10
  `;

  return results;
};
