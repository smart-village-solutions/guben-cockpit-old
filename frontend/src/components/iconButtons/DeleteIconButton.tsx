import { CustomTooltip } from "@/components/general/Tooltip";
import { DialogTrigger } from "@/components/ui/dialog";
import { Trash2Icon } from "lucide-react";

import { IconButtonBase } from "./IconButtonBase";

interface DeleteIconButtonProps {
  tooltip: string;
  dialogTrigger: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
  onClick?: () => void;
}

const IconButton = (props: { disabled?: boolean; onClick?: () => void; label: string }) => (
  <IconButtonBase
    disabled={props.disabled}
    icon={Trash2Icon}
    onClick={props.onClick}
    label={props.label}
    className={props.disabled
      ? "bg-gray-200 text-gray-400"
      : "text-red-500 bg-white hover:cursor-pointer hover:bg-gray-200"}
  />
);

export const DeleteIconButton = ({ tooltip, dialogTrigger, disabled, disabledTooltip, onClick }: DeleteIconButtonProps) => {
  const label = disabled ? disabledTooltip ?? tooltip : tooltip;

  return (
    <CustomTooltip text={disabled ? disabledTooltip ?? "" : tooltip}>
      {dialogTrigger
        ? (
          <DialogTrigger asChild>
            <IconButton {...{ disabled, label }} />
          </DialogTrigger>
        ) : <IconButton {...{ onClick, disabled, label }} />
      }
    </CustomTooltip>
  );
};
