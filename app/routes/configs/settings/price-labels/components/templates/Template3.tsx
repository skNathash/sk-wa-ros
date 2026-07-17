import React from "react";
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
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
  },
  topSection: {
    flexGrow: 1,
    borderBottom: "2px solid black",
    padding: "2px 5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  offContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginRight: "2px",
    fontWeight: 700,
  },
  offText: {
    fontSize: "14px",
    lineHeight: "1",
  },
  currency: {
    fontSize: "19px",
    lineHeight: "0.8",
    marginTop: "2px",
  },
  discountAmount: {
    fontWeight: 700,
    lineHeight: "1",
    marginTop: "-4px",
    letterSpacing: "-2px",
  },
  bottomSection: {
    padding: "2px 5px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "29px",
  },
  productNameContainer: {
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2px",
    overflow: "hidden",
  },
  productNameText: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: "8.5px",
    lineHeight: "1.1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  prices: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "8px",
    fontWeight: 700,
  },
  mrp: {
    textDecoration: "line-through",
  },
};

const Template3: React.FC<TemplateProps> = ({ name, price, mrp, saving }) => {
  const discount = getSaving(saving, mrp, price);
  if (discount <= 0) {
    return <NoSavingLabel name={name} price={price} mrp={mrp} />;
  }
  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <div style={styles.offContainer}>
          <span style={styles.offText}>OFF</span>
          <span style={styles.currency}>₹</span>
        </div>
        <BigNumber
          value={discount}
          base={30}
          tracking={-2}
          style={{ marginTop: "-4px" }}
        />
      </div>

      <div style={styles.bottomSection}>
        <div style={styles.productNameContainer}>
          <div style={styles.productNameText}>{name}</div>
        </div>

        <div style={styles.prices}>
          <span style={styles.mrp}>MRP ₹{mrp}</span>
          <span>OUR PRICE ₹{price}</span>
        </div>
      </div>
    </div>
  );
};

export default Template3;
