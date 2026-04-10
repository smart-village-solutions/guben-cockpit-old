import { PencilIcon } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import { CustomTooltip } from "@/components/general/Tooltip";
import { WithClassName } from "@/types/WithClassName";

import { IconButtonBase } from "./IconButtonBase";

interface EditIconButtonProps extends WithClassName {
  tooltip: string;
  disabledTooltip?: string;
  dialogTrigger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const IconButton = (props: { disabled?: boolean; onClick?: () => void }) => (
  <IconButtonBase
    disabled={props.disabled}
    icon={PencilIcon}
    onClick={props.onClick}
    className={props.disabled
      ? "bg-gray-200 text-gray-400"
      : "bg-white hover:cursor-pointer hover:bg-gray-200"}
  />
);

export const EditIconButton = ({ tooltip, disabledTooltip, onClick, className, dialogTrigger = false, disabled = false }: EditIconButtonProps) => {
  return (
    <CustomTooltip text={disabled ? disabledTooltip ?? "" : tooltip} className={className}>
      {dialogTrigger
        ? (
          <DialogTrigger asChild>
            <IconButton {...{ disabled }} />
          </DialogTrigger>
        ) : <IconButton {...{ onClick, disabled }} />
      }
    </CustomTooltip>
  );
};
