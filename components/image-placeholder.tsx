type ImagePlaceholderProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

export function ImagePlaceholder({ label = "Imagem em breve", className = "", compact = false }: ImagePlaceholderProps) {
  return (
    <div className={`image-placeholder ${compact ? "image-placeholder--compact" : ""} ${className}`} aria-label={label} role="img">
      <span className="image-placeholder__mark" aria-hidden="true">✦</span>
      <span>{label}</span>
    </div>
  );
}
