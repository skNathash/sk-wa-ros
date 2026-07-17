import { ShoppingBagIcon } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";

const Footer = () => {
  const appNav = useAppNav();

  if (1) {
    return null;
  }

  return (
    <div className="app-footer">
      <div className="tw:text-end">
        <AppButton onClick={() => appNav.to("/products/cart")} size="small">
          <ShoppingBagIcon size={16} />
          View Cart
        </AppButton>
      </div>
    </div>
  );
};

export default Footer;
