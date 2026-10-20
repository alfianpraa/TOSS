export type ParsedLead = {
  contactName: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  need: string;
};

type Field = keyof ParsedLead;

// Maps a normalized label (Indonesian or English) to a lead field.
function fieldForLabel(raw: string): Field | null {
  const label = raw.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (!label) return null;
  if (/(perusahaan|company|instansi|organisasi|organization)/.test(label)) return "company";
  if (/(kebutuhan|requirement|needs?|keperluan|keterangan)/.test(label)) return "need";
  if (/^e ?mail/.test(label)) return "email";
  if (/(telepon|telp|tlp|phone|whatsapp|^wa$|^hp|no hp|handphone|mobile)/.test(label)) return "phone";
  if (/^(kota|city|domisili|lokasi|location)/.test(label)) return "city";
  if (/^(nama|name|contact|kontak|pic)/.test(label)) return "contactName";
  return null;
}

function emptyLead(): ParsedLead {
  return { contactName: "", company: "", email: "", phone: "", city: "", need: "" };
}

function clean(value: string) {
  const v = value.trim();
  return /^[-–—.]*$/.test(v) ? "" : v;
}

const NOISE = /^(forwarded|diteruskan|\d{1,2}[:.]\d{2}(\s?[ap]m)?)$/i;

// Parses one or more "Label : value" lead messages (e.g. pasted from WhatsApp).
export function parseLeads(text: string): ParsedLead[] {
  const leads: ParsedLead[] = [];
  let current = emptyLead();
  let last: Field | null = null;

  const push = () => {
    if (Object.values(current).some(Boolean)) leads.push(current);
    current = emptyLead();
    last = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || NOISE.test(line)) continue;

    const sep = line.indexOf(":");
    const field = sep > 0 ? fieldForLabel(line.slice(0, sep)) : null;

    if (field) {
      let value = clean(line.slice(sep + 1));
      if (field === "email") {
        value = value.match(/[^\s<>()]+@[^\s<>()]+\.[^\s<>()]+/)?.[0] ?? value;
      }
      // A second contact name means a new lead started.
      if (field === "contactName" && current.contactName) push();
      current[field] = value;
      last = field;
    } else if (last === "need") {
      // Requirement text can wrap onto the following lines.
      current.need = `${current.need} ${line}`.trim();
    }
  }
  push();
  return leads;
}

export type LeadFormValues = {
  title: string;
  clientName: string;
  clientContact: string;
  description: string;
};

export function leadToFormValues(lead: ParsedLead): LeadFormValues {
  const clientName = lead.company || lead.contactName;
  const title = [lead.need, lead.company].filter(Boolean).join(" - ");
  const clientContact = [lead.phone, lead.email].filter(Boolean).join(" / ");
  const description = [
    lead.contactName && `Contact person: ${lead.contactName}`,
    lead.city && `City: ${lead.city}`,
    lead.need && `Requirement: ${lead.need}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { title, clientName, clientContact, description };
}
