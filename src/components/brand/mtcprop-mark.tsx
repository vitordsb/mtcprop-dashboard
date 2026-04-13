import Image from "next/image";

type MtcpropMarkProps = {
  theme?: "light" | "dark";
  align?: "center" | "left";
  size?: "regular" | "compact";
  variant?: "wordmark" | "symbol";
};

export function MtcpropMark({
  theme = "light",
  align = "center",
  size = "regular",
  variant = "wordmark",
}: MtcpropMarkProps) {
  const containerClassName =
    align === "left" ? "flex justify-start" : "flex justify-center";
  const isCompact = size === "compact";
  const isSymbol = variant === "symbol";
  const width = isCompact ? 152 : 214;
  const height = isCompact ? 76 : 107;
  const logoSrc =
    theme === "dark"
      ? "/brand/mtcprop-logo-green.png"
      : "/brand/mtcprop-logo-dark.png";

  return (
    <div className={containerClassName}>
      <Image
        src={isSymbol ? "/brand/mtcprop-symbol.png" : logoSrc}
        alt="MTCprop"
        width={isSymbol ? 96 : width}
        height={isSymbol ? 96 : height}
        className={
          isSymbol
            ? "h-16 w-16 object-contain"
            : isCompact
              ? "h-auto w-[152px]"
              : "h-auto w-[214px]"
        }
        priority
      />
    </div>
  );
}
