import { Switch } from "~/components/ui/switch";

const AppSwitch = ({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string | React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <div className="tw:flex tw:items-center tw:gap-2">
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      {label && <span className="tw:text-xs tw:font-medium">{label}</span>}
    </div>
  );
};

export default AppSwitch;
