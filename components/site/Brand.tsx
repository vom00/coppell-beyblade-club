import { useId } from "react";
import { amazonParts, brandPaths, type BrandKey } from "./brand-paths";

// simple-icons draws Walmart as the full wordmark with the spark at its right end. The site writes the
// name beside each mark, so the view box is cropped to the spark alone.
const viewBoxes: Partial<Record<BrandKey, string>> = {
  walmart: "18.3 8.9 6.2 6.2",
};

// Each brand's own colour. Instagram and Amazon are drawn in more than one colour below.
const fills: Partial<Record<BrandKey, string>> = {
  discord: "#5865F2",
  youtube: "#FF0000",
  walmart: "#FFC220",
};

/**
 * A brand mark in the brand's own colours. Decorative: the text beside it names the brand.
 * Inside a solid red button the stylesheet repaints every path in the button's text colour (see .brand-mark
 * in globals.css), so the mark stays readable there.
 */
export function BrandMark({ brand, className = "" }: { brand: BrandKey; className?: string }) {
  const gradient = useId();
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox={viewBoxes[brand] ?? "0 0 24 24"}
      aria-hidden="true"
      focusable="false"
    >
      {brand === "instagram" && (
        <>
          <defs>
            <linearGradient id={gradient} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FFD600" />
              <stop offset="0.3" stopColor="#FF7A00" />
              <stop offset="0.55" stopColor="#FF0069" />
              <stop offset="0.8" stopColor="#D300C5" />
              <stop offset="1" stopColor="#7638FA" />
            </linearGradient>
          </defs>
          <path d={brandPaths.instagram} fill={`url(#${gradient})`} />
        </>
      )}
      {brand === "amazon" && (
        <>
          <path d={amazonParts.letter} fill="currentColor" />
          <path d={amazonParts.smile} fill="#FF9900" />
        </>
      )}
      {brand === "youtube" && <path className="brand-mark__under" d="M9.4 8.3v7.4l6.6-3.7z" fill="#fff" />}
      {brand !== "instagram" && brand !== "amazon" && <path d={brandPaths[brand]} fill={fills[brand] ?? "currentColor"} />}
    </svg>
  );
}

/** The mark for a retailer named in lib/content.ts. */
export function RetailerMark({ retailer, className = "" }: { retailer: string; className?: string }) {
  const key = retailer.toLowerCase();
  return key === "walmart" || key === "amazon" ? <BrandMark brand={key} className={className} /> : null;
}

/** The World Beyblade Organization's own logo. It carries the letters WBO, so pass alt="" when the name is beside it. */
export function WboLogo({ className = "", alt = "WBO" }: { className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`wbo-logo ${className}`} src="/logos/wbo.webp" width={264} height={85} alt={alt} decoding="async" />
  );
}
