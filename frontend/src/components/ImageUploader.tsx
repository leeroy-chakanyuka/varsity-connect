import { useId, useState } from "react";
import { api } from "../api/client";

export type UploadPurpose = "PROFILE" | "LISTING" | "LOST_FOUND" | "COMMUNITY";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface StoredFile {
  filename: string;
  url: string;
}

/* reusable picker, uploads straight away and hands urls back up */
export function ImageUploader({
  value,
  onChange,
  purpose = "LISTING",
  max = 5,
  label = "images",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  purpose?: UploadPurpose;
  max?: number;
  label?: string;
}) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    const chosen = Array.from(files);
    setProblem(null);

    /* client-side mirrors of the server rules, instant feedback */
    const rejected = chosen.find(
      (file) => !ACCEPTED.includes(file.type) || file.size > MAX_BYTES,
    );
    if (rejected) {
      setProblem(
        !ACCEPTED.includes(rejected.type)
          ? `${rejected.name} is not a supported image (jpg, png, webp)`
          : `${rejected.name} exceeds 5 MB`,
      );
      return;
    }
    if (value.length + chosen.length > max) {
      setProblem(`at most ${max} images allowed`);
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      chosen.forEach((file) => form.append("files", file));
      form.append("purpose", purpose);
      /* no content-type header, the browser adds the multipart boundary */
      const { data } = await api.post<{ files: StoredFile[] }>("/media/uploads", form);
      onChange([...value, ...data.files.map((file) => file.url)]);
    } catch {
      setProblem("upload failed, try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="cursor-pointer rounded-xl border border-dashed border-sage bg-white px-4 py-3 text-center text-sm lowercase text-taupe transition hover:border-rosewood hover:text-cocoa"
      >
        {busy ? "uploading…" : `choose ${label}`}
      </label>
      <input
        id={inputId}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple={max > 1}
        disabled={busy}
        onChange={(event) => {
          void pick(event.target.files);
          event.target.value = "";
        }}
        className="sr-only"
      />

      {problem && (
        <p role="alert" className="text-xs lowercase text-red-500">
          {problem}
        </p>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((url) => (
            <li key={url} className="relative overflow-hidden rounded-xl border border-sage/70">
              <img src={url} alt="uploaded preview" className="aspect-square w-full object-cover" />
              <button
                type="button"
                aria-label={`remove ${url}`}
                onClick={() => onChange(value.filter((kept) => kept !== url))}
                className="absolute right-1 top-1 rounded-full bg-cocoa/80 px-2 py-0.5 text-xs lowercase text-white"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
