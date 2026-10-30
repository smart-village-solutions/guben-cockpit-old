import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDroppable } from "@dnd-kit/core";

export interface DragAndDropProps {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  acceptExtensions?: string[];
  maxSizeBytes?: number;
  className?: string;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({
  file,
  onFileSelected,
  acceptExtensions = [],
  maxSizeBytes,
  className = "",
  disabled = false,
  label,
  hint,
}) => {
  const { t } = useTranslation(["common"]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setNodeRef } = useDroppable({ id: "geodata-dropzone" });

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const validate = (f: File) => {
    if (acceptExtensions.length > 0) {
      const ok = acceptExtensions.some((ext) =>
        f.name.toLowerCase().endsWith(ext.toLowerCase())
      );
      if (!ok) return t("common:DragAndDrop.Accepted", { extensions: acceptExtensions.join(", ") });
    }
    if (maxSizeBytes && f.size > maxSizeBytes) {
      return t("common:DragAndDrop.ErrorTooLarge", { max: (maxSizeBytes / (1024 * 1024)).toFixed(0) });
    }
    return null;
  };

  const pick = (f: File | null) => {
    setError(null);
    if (!f) {
      onFileSelected(null);
      clearInput();
      return;
    }
    const v = validate(f);
    if (v) {
      setError(v);
      onFileSelected(null);
      clearInput();
      return;
    }
    onFileSelected(f);
  };

  const onBrowse = () => {
    if (disabled) return;
    clearInput();
    inputRef.current?.click();
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pick(e.target.files?.[0] ?? null);
  };

  const onDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    if (Array.from(e.dataTransfer.types || []).includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
      if (!isOver) setIsOver(true);
    }
  };

  const onDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const onDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      pick(files[0]);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        ref={setNodeRef}
        disabled={disabled}
        aria-label="File dropzone"
        onClick={onBrowse}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "block w-full rounded-2xl border-2 border-dashed p-8 text-center transition select-none",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          isOver ? "border-gubenAccent bg-gubenAccent/5" : "border-gray-300",
        ].join(" ")}
      >
        <span className="block font-medium">{label ?? t('common:DragAndDrop.Label')}</span>
        <span className="block text-sm text-gray-500 mt-1">{hint ?? t('common:DragAndDrop.Hint')}</span>

        {acceptExtensions.length > 0 && (
          <span className="block text-xs text-gray-500 mt-1">
            {t("common:DragAndDrop.Accepted", { extensions: acceptExtensions.join(", ") })}
          </span>
        )}

        <span className="inline-block mt-3 rounded-lg bg-gubenAccent text-white px-4 py-2 hover:opacity-90">
          {t("common:DragAndDrop.Browse")}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptExtensions.length ? acceptExtensions.join(",") : undefined}
        onChange={onInputChange}
        disabled={disabled}
      />

      {file && (
        <div className="rounded-lg border px-4 py-3 text-sm flex items-center justify-between mt-3">
          <div className="truncate">
            <span className="font-medium">{t("common:DragAndDrop.Selected")}</span> {file.name}
          </div>
          <button
            type="button"
            className="text-red-600 hover:underline ml-4"
            onClick={() => pick(null)}
            disabled={disabled}
          >
            {t("common:DragAndDrop.Remove")}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm mt-3">
          {error}
        </div>
      )}
    </div>
  );
};

export { DragAndDrop };
