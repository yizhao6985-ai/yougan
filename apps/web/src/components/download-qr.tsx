type DownloadQrProps = {
  value: string;
  size?: number;
  label: string;
};

function buildQrImageUrl(value: string, size: number) {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    margin: "8",
    data: value,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params}`;
}

export function DownloadQr({ value, size = 200, label }: DownloadQrProps) {
  if (!value) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted text-sm text-muted-foreground/70"
        style={{ width: size, height: size }}
        aria-hidden
      >
        待配置
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm shadow-border/25">
      <img
        src={buildQrImageUrl(value, size)}
        width={size}
        height={size}
        alt={label}
        className="block rounded-md"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
