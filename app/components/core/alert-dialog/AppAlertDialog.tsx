import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

const AppAlertDialog = ({
  title,
  description,
  onConfirm,
  onCancel,
  type = "confirm",
  okText = "Continue",
  cancelText = "Cancel",
  show = false,
}: {
  title: React.ReactNode | string;
  description: React.ReactNode | string;
  onConfirm?: (() => void) | null;
  onCancel?: (() => void) | null;
  type?: "alert" | "confirm";
  okText?: string;
  cancelText?: string;
  show?: boolean;
}) => {
  return (
    <AlertDialog open={show}>
      <AlertDialogContent>
        {title ? (
          <AlertDialogHeader>
            {title ? <AlertDialogTitle>{title}</AlertDialogTitle> : null}
            {description ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
        ) : null}

        <AlertDialogFooter>
          {type === "confirm" ? (
            <>
              <AlertDialogCancel
                onClick={onCancel || (() => {})}
                className="tw:cursor-pointer"
              >
                {cancelText}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm || (() => {})}
                className="tw:cursor-pointer"
              >
                {okText}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              onClick={onConfirm || (() => {})}
              className="tw:cursor-pointer"
            >
              {okText}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AppAlertDialog;
