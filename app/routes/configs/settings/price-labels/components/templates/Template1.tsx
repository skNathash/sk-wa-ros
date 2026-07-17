import React from "react";
import Amount from "~/components/core/amount/Amount";
import { getSaving } from "./helper";
import NoSavingLabel from "./NoSavingLabel";
import BigNumber from "./BigNumber";

interface TemplateProps {
  name: string;
  price: number;
  mrp: number;
  saving?: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: "2px solid black",
    fontFamily: "inherit",
    lineHeight: "1.2",
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    borderBottom: "2px solid black",
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "52px",
    overflow: "hidden",
  },
  headerText: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "13px",
    lineHeight: "1.2",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
  },
  body: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    flexGrow: 1,
  },
  discountSection: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
  },
  offSymbol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: "4px",
  },
  offText: {
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "-4px",
  },
  rupeeSymbol: {
    fontSize: "23px",
    fontWeight: 700,
  },
  discountNumber: {
    fontWeight: 700,
    letterSpacing: "-2px",
  },
  priceSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    fontSize: "10px",
    fontWeight: 700,
  },
  mrpRow: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: "4px",
  },
  mrpLabel: {
    verticalAlign: "top",
  },
  mrpValue: {
    textDecoration: "line-through",
    fontSize: "14px",
    fontWeight: 700,
    marginLeft: "4px",
  },
  ourPriceRow: {
    display: "flex",
    alignItems: "baseline",
  },
  ourPriceLabel: {
    verticalAlign: "top",
  },
  ourPriceValue: {
    fontSize: "14px",
    fontWeight: 700,
    marginLeft: "4px",
  },
};

const Template1: React.FC<TemplateProps> = ({ name, price, mrp, saving }) => {
  const discount = getSaving(saving, mrp, price);
  if (discount <= 0) {
    return <NoSavingLabel name={name} price={price} mrp={mrp} />;
  }
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>{name}</div>
      </div>

      <div style={styles.body}>
        <div style={styles.discountSection}>
          <div style={styles.offSymbol}>
            <span style={styles.offText}>OFF</span>
            <span style={styles.rupeeSymbol}>₹</span>
          </div>
          <BigNumber value={discount} base={38} tracking={-2} />
        </div>

        <div style={styles.priceSection}>
          <div style={styles.mrpRow}>
            <span style={styles.mrpLabel}>MRP</span>
            <span style={styles.mrpValue}>
              <Amount value={mrp} />
            </span>
          </div>
          <div style={styles.ourPriceRow}>
            <span style={styles.ourPriceLabel}>OUR PRICE</span>
            <span style={styles.ourPriceValue}>
              <Amount value={price} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template1;
