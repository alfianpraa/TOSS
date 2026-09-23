"use client";

import { useRef, useState, useTransition } from "react";
import { createCard } from "@/lib/actions/cards";

export function NewCardDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCard(undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setOpen(false);
      formRef.current?.reset();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        + Card Baru
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Buat Lead / Project Baru
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">
                  Judul Project
                </label>
                <input
                  name="title"
                  required
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Website Company Profile - PT ABC"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">
                  Nama Client
                </label>
                <input
                  name="clientName"
                  required
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="PT ABC"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">
                  Kontak Client
                </label>
                <input
                  name="clientContact"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="email / no. WhatsApp"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">
                  Deskripsi / Kebutuhan
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Ringkasan kebutuhan lead"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
