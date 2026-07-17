import React from "react";
import { fitDiscountFontSize, formatLabelAmount } from "./helper";

interface Props {
  value: number | string;
  /** Base font size (px) for short values; scaled down for longer ones. */
  base: number;
  /** Negative tracking (px) applied to the integer digits only. */
  tracking?: number;
  /** Show a leading ₹ symbol. */
  symbol?: boolean;
  style?: React.CSSProperties;
}

/**
 * Renders a large price/discount number. The integer part gets tight negative
 * letter-spacing so big numbers fit; the decimal part (e.g. ".50") is rendered
 * smaller with normal spacing so the dot stays legible instead of being
 * crushed into the digits. Whole numbers print without any decimal.
 */
const BigNumber: React.FC<Props> = ({
  value,
  base,
  tracking = -2,
  symbol = false,
  style,
}) => {
  const formatted = formatLabelAmount(value);
  const [intPart, decPart] = formatted.split(".");
  const fontSize = fitDiscountFontSize(formatted.replace(".", ""), base);

  return (
    <span
      style={{
        fontWeight: 800,
        lineHeight: 1,
        fontSize: `${fontSize}px`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {symbol && <span style={{ marginRight: "1.5px" }}>₹</span>}
      <span style={{ letterSpacing: `${tracking * 0.5}px` }}>{intPart}</span>
      {decPart && (
        <span
          style={{
            fontSize: `${Math.round(fontSize * 0.55)}px`,
            marginLeft: "2px",
            letterSpacing: "normal",
          }}
        >
          .{decPart}
        </span>
      )}
    </span>
  );
};

export default BigNumber;
