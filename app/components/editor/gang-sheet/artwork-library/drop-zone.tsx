import { useState, type ChangeEvent, type DragEvent, type RefObject } from "react";
import { UPLOAD_ACCEPT } from "./artwork-library-model";

type DropZoneProps = {
  compact?: boolean;
  uploading?: boolean;
  empty?: boolean;
  noMatches?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onFiles: (files: File[]) => void;
};

export function ArtworkDropZone({
  compact = true,
  uploading,
  empty,
  noMatches,
  inputRef,
  onFiles,
}: DropZoneProps) {
  const [active, setActive] = useState(false);

  function handleFiles(list: FileList | File[] | null) {
    const files = list ? Array.from(list) : [];
    if (files.length) onFiles(files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setActive(false);
    handleFiles(e.dataTransfer.files);
  }

  const title = uploading
    ? "Uploading…"
    : noMatches
      ? "No matches"
      : empty
        ? "Drop files to upload"
        : "Drop PNG/JPEG";
  const hint = uploading
    ? "Please wait"
    : noMatches
      ? "Clear search or drop new files"
      : "PNG/JPEG · click to browse";

  return (
    <label
      className={`lgs-artlib-drop drop-target${compact && !empty ? "" : " roomy"}${active ? " active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={onDrop}
    >
      <strong>{title}</strong>
      <small>{hint}</small>
      <input
        ref={inputRef as RefObject<HTMLInputElement>}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        hidden
        onChange={onChange}
      />
    </label>
  );
}
