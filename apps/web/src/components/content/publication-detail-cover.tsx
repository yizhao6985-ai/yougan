/** 内容详情页头图：独立于发现页列表封面，宽屏阅读比例 */
export function PublicationDetailCover({
  coverUrl,
}: {
  coverUrl: string | null;
}) {
  const url = coverUrl?.trim();
  if (!url) return null;

  return (
    <figure className="w-full overflow-hidden rounded-2xl border border-border/70">
      <img
        src={url}
        alt=""
        className="aspect-[16/10] w-full object-cover"
      />
    </figure>
  );
}
