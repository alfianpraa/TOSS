"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { createCard } from "@/lib/actions/cards";
import {
  leadToFormValues,
  parseLeads,
  type LeadFormValues,
  type ParsedLead,
} from "@/lib/leadParser";

const FIELD =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const EMPTY: LeadFormValues = { title: "", clientName: "", clientContact: "", description: "" };

const PASTE_EXAMPLE = `Nama : Sulaiman
Nama Perusahaan : PT Fast Food Indonesia Tbk.
Email : -
Telepon / HP : 081931273493
Kota : Jakarta
Detail Kebutuhan : Menghitung Berapa Banyak Traffic`;

export function NewCardDialog({
  role,
  salesUsers,
}: {
  role: Role;
  salesUsers: { id: string; name: string }[];
}) {
  const canHandOff = role === "MARKETING" || role === "ADMIN";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "paste">("manual");
  const [values, setValues] = useState<LeadFormValues>(EMPTY);
  const [pasted, setPasted] = useState("");
  const [detected, setDetected] = useState<ParsedLead[]>([]);
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const [filled, setFilled] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function setField(key: keyof LeadFormValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function closeDialog() {
    setOpen(false);
  }

  function applyLead(lead: ParsedLead) {
    setValues(leadToFormValues(lead));
    setFilled(true);
    setDetected([]);
    setPasteNote(null);
    setPasted("");
    setTab("manual");
  }

  function analyze(text: string) {
    const leads = parseLeads(text);
    if (leads.length === 0) {
      setDetected([]);
      setPasteNote(
        text.trim()
          ? "Couldn't find any fields. Use lines like “Nama : …”, “Perusahaan : …”, “Telepon : …”."
          : null
      );
      return;
    }
    if (leads.length === 1) {
      applyLead(leads[0]);
      return;
    }
    setPasteNote(`Found ${leads.length} leads. Pick the one to create now.`);
    setDetected(leads);
  }

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
      setValues(EMPTY);
      setFilled(false);
      setOpen(false);
    });
  }

  const tabClass = (active: boolean) =>
    `flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        + New Card
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">
                Create New Lead / Project
              </h2>
              <button
                type="button"
                onClick={closeDialog}
                className="cursor-pointer text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex gap-1 rounded-lg bg-zinc-100 p-1">
              <button type="button" onClick={() => setTab("manual")} className={tabClass(tab === "manual")}>
                Fill manually
              </button>
              <button type="button" onClick={() => setTab("paste")} className={tabClass(tab === "paste")}>
                Paste message
              </button>
            </div>

            {tab === "paste" && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-sm text-zinc-500">
                  Paste a lead message (e.g. from WhatsApp). The fields are filled in
                  automatically.
                </p>
                <textarea
                  value={pasted}
                  onChange={(e) => {
                    setPasted(e.target.value);
                    setDetected([]);
                    setPasteNote(null);
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (!text) return;
                    e.preventDefault();
                    setPasted(text);
                    analyze(text);
                  }}
                  rows={8}
                  autoFocus
                  className={`${FIELD} resize-y font-mono text-xs`}
                  placeholder={PASTE_EXAMPLE}
                />

                {pasteNote && (
                  <p className={`text-sm ${detected.length > 0 ? "text-zinc-600" : "text-red-600"}`}>
                    {pasteNote}
                  </p>
                )}

                {detected.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {detected.map((lead, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {lead.company || lead.contactName || "Unnamed lead"}
                          </p>
                          <p className="truncate text-xs text-zinc-400">
                            {[lead.contactName, lead.city].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyLead(lead)}
                          className="shrink-0 cursor-pointer rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
                        >
                          Use this lead
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!pasted.trim()}
                    onClick={() => analyze(pasted)}
                    className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Fill the form
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`mt-4 flex flex-col gap-3 ${tab === "paste" ? "hidden" : ""}`}
            >
              {filled && (
                <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  Filled from the pasted message. Please review before saving.
                </p>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Project Title</label>
                <input
                  name="title"
                  required
                  value={values.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={FIELD}
                  placeholder="Company Profile Website - ABC Inc."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Client Name</label>
                <input
                  name="clientName"
                  required
                  value={values.clientName}
                  onChange={(e) => setField("clientName", e.target.value)}
                  className={FIELD}
                  placeholder="ABC Inc."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">Client Contact</label>
                <input
                  name="clientContact"
                  value={values.clientContact}
                  onChange={(e) => setField("clientContact", e.target.value)}
                  className={FIELD}
                  placeholder="email / WhatsApp number"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-zinc-700">
                  Description / Requirements
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={values.description}
                  onChange={(e) => setField("description", e.target.value)}
                  className={FIELD}
                  placeholder="Summary of the lead's requirements"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Priority</label>
                  <select name="priority" defaultValue="MEDIUM" className={FIELD}>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">
                    Deadline <span className="text-zinc-400">(optional)</span>
                  </label>
                  <input type="date" name="dueDate" className={FIELD} />
                </div>
              </div>

              {canHandOff && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-700">Hand over to Sales</label>
                  <select name="salesOwnerId" defaultValue="" className={FIELD}>
                    <option value="">
                      {role === "ADMIN" ? "Keep for myself" : "Not yet (Sales picks it up)"}
                    </option>
                    {salesUsers.map((sales) => (
                      <option key={sales.id} value={sales.id}>
                        {sales.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
