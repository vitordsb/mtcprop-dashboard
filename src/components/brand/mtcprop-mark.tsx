import Image from "next/image";

type MtcpropMarkProps = {
  theme?: "light" | "dark";
  align?: "center" | "left";
  size?: "regular" | "compact";
};

export function MtcpropMark({
  theme = "light",
  align = "center",
  size = "regular",
}: MtcpropMarkProps) {
  const containerClassName =
    align === "left" ? "flex justify-start" : "flex justify-center";
  const isCompact = size === "compact";
  const width = isCompact ? 152 : 214;
  const height = isCompact ? 76 : 107;
  const logoSrc =
    theme === "dark"
      ? "/brand/mtcprop-logo-green.png"
      : "/brand/mtcprop-logo-dark.png";

  return (
    <div className={containerClassName}>
      <Image
        src={logoSrc}
        alt="MTCprop"
        width={width}
        height={height}
        className={isCompact ? "h-auto w-[152px]" : "h-auto w-[214px]"}
        priority
      />
    </div>
  );
}
