import { prisma } from "../db.js";

export type PublicUserProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  publicationCount: number;
};

export type UserProfileStats = {
  publicationCount: number;
  totalViews: number;
  publicationsByMonth: Array<{ month: string; count: number }>;
};

function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function lastMonths(count: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export async function getPublicUserProfile(
  userId: string,
): Promise<PublicUserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
      avatarUrl: true,
      coverUrl: true,
    },
  });
  if (!user) return null;

  const publicationCount = await prisma.publication.count({
    where: { userId, status: "published" },
  });

  return { ...user, publicationCount };
}

export async function getUserProfileStats(
  userId: string,
): Promise<UserProfileStats | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return null;

  const [publicationCount, viewsAgg, publishedRows] = await Promise.all([
    prisma.publication.count({
      where: { userId, status: "published" },
    }),
    prisma.publication.aggregate({
      where: { userId, status: "published" },
      _sum: { viewCount: true },
    }),
    prisma.publication.findMany({
      where: { userId, status: "published", publishedAt: { not: null } },
      select: { publishedAt: true },
    }),
  ]);

  const countByMonth = new Map<string, number>();
  for (const row of publishedRows) {
    if (!row.publishedAt) continue;
    const key = monthKey(row.publishedAt);
    countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
  }

  const publicationsByMonth = lastMonths(6).map((month) => ({
    month,
    count: countByMonth.get(month) ?? 0,
  }));

  return {
    publicationCount,
    totalViews: viewsAgg._sum.viewCount ?? 0,
    publicationsByMonth,
  };
}
