"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, FileText, Trash2, Download } from "lucide-react";
import { uploadCardFile, deleteCardFile } from "@/lib/actions/files";
import { MAX_CARD_FILE_BYTES } from "@/lib/fileLimits";

export type CardFileEntry = {
  id: string;
  filename: string;
  storedName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  uploadedById: string;
  uploadedBy: { name: string };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function CardFiles({
  cardId,
  files,
  currentUserId,
  isAdmin,
}: {
  cardId: string;
  files: CardFileEntry[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Please select a file to upload.");
      return;
    }

    if (file.size > MAX_CARD_FILE_BYTES) {
      setError(
        `File is too large (${formatSize(file.size)}). Max size is ${formatSize(MAX_CARD_FILE_BYTES)}.`
      );
      return;
    }

    setError(undefined);
    startTransition(async () => {
      const result = await uploadCardFile(cardId, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      formRef.current?.reset();
      router.refresh();
    });
  }

  function handleDelete(fileId: string) {
    startTransition(async () => {
      await deleteCardFile(fileId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-700">
          Files {files.length > 0 && `(${files.length})`}
        </h2>
      </div>

      {files.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">No files uploaded yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-1 rounded-md border border-zinc-200 px-3 py-2"
            >
              <a
                href={`/uploads/cards/${cardId}/${file.storedName}`}
                target="_blank"
                rel="noopener noreferrer"
                download={file.filename}
                title={file.filename}
                className="flex min-w-0 items-center gap-2 text-sm text-zinc-700 hover:text-brand"
              >
                <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 flex-1 truncate font-medium">{file.filename}</span>
                <Download className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
              </a>
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                <span className="truncate">
                  {formatSize(file.size)} · {file.uploadedBy.name} · {formatDate(file.createdAt)}
                </span>
                {(file.uploadedById === currentUserId || isAdmin) && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(file.id)}
                    className="shrink-0 cursor-pointer text-zinc-300 hover:text-red-600 disabled:cursor-not-allowed"
                    aria-label="Delete file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-3 flex flex-wrap items-center gap-2"
      >
        <input
          type="file"
          name="file"
          required
          className="flex-1 text-xs text-zinc-500 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-zinc-600 hover:file:bg-zinc-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Uploading..." : "Upload"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-[11px] text-zinc-400">Max 15MB per file.</p>
    </div>
  );
}
