import { useMemo, useState, type ReactNode } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useTheme } from "@/context/ThemeContext";
import { LayoutPanelTop, FileText, Signature, ClipboardList, Plus, Printer, Trash2, Upload } from "lucide-react";

type QuotationMode = "editor" | "client";

type QuotationItem = {
  sn: number;
  description: string;
  qty: number;
  unitPrice: number;
};

type QuotationRow = QuotationItem & { amount: number };
type SignatureAsset = { name: string; dataUrl: string } | null;

const capabilities = [
  "Offset Printing",
  "Wedding & Invitation Cards",
  "Office Supply",
  "General Stationary",
  "Design , Large Format",
  "Digital Printing, PVC Banners, Stickers",
  "Promotional Items",
  "T-shirts, Caps, Digital Printing",
];

const terms = [
  "50% Advance upon order and 50% on delivery for orders amounting to more than 100,000 FRW",
  "100% payment for Orders amounting Or a Valid Purchase Order ( Only for Institutions with a Running Contract) from Duplicator Ltd",
];

const paymentMethods = [
  "- Pay Cash or Cheque in names: DUPLICATOR Ltd",
  "- Transfer to bank of Africa: 01713010005 (FRW)",
  "- Transfer to bank of Africa: 01713010018 (USD $)",
  "- Transfer to Bank of kigali: 00040-00407411-44 (FRW)",
];

const SIGNATURE_OPTIONS = ["Receiver", "Client Representative", "Sales Manager", "Print Operator", "Owner"] as const;
const EDITOR_TABS = [
  { id: "details", label: "Details", icon: LayoutPanelTop },
  { id: "items", label: "Items", icon: ClipboardList },
  { id: "signatures", label: "Signatures", icon: Signature },
  { id: "paper", label: "Paper", icon: FileText },
] as const;
const CLIENT_TABS = [
  { id: "paper", label: "Quotation", icon: FileText },
  { id: "terms", label: "Terms", icon: ClipboardList },
  { id: "signatures", label: "Signatures", icon: Signature },
  { id: "payment", label: "Payment", icon: LayoutPanelTop },
] as const;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(value || 0);
}

function amountInWords(value: number) {
  return `${formatMoney(value)} Rwandan Francs`;
}

function prettyDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function useFileSignature() {
  const [asset, setAsset] = useState<SignatureAsset>(null);
  const importSignature = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAsset({ name: file.name, dataUrl: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  };
  return { asset, importSignature };
}

export default function SalesQuotationPage({ mode = "editor" }: { mode?: QuotationMode }) {
  const { isDark } = useTheme();
  const [clientName, setClientName] = useState("");
  const [partyTin, setPartyTin] = useState("");
  const [quotationNo, setQuotationNo] = useState("DPL-Q-0001");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiverSignature, setReceiverSignature] = useState("Receiver");
  const [senderSignature, setSenderSignature] = useState("Sales Manager");
  const [clientSignature, setClientSignature] = useState("Client Representative");
  const [items, setItems] = useState<QuotationItem[]>([
    { sn: 1, description: "", qty: 1, unitPrice: 0 },
    { sn: 2, description: "", qty: 1, unitPrice: 0 },
    { sn: 3, description: "", qty: 1, unitPrice: 0 },
    { sn: 4, description: "", qty: 1, unitPrice: 0 },
  ]);
  const [remarks, setRemarks] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof EDITOR_TABS)[number]["id"] | (typeof CLIENT_TABS)[number]["id"]>(
    mode === "client" ? "paper" : "details",
  );

  const receiverSig = useFileSignature();
  const senderSig = useFileSignature();
  const clientSig = useFileSignature();
  const tabs = mode === "client" ? CLIENT_TABS : EDITOR_TABS;

  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        amount: Number(item.qty || 0) * Number(item.unitPrice || 0),
      })),
    [items],
  );

  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const vat = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + vat;

  function updateItem(index: number, patch: Partial<QuotationItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addRow() {
    setItems((current) => [...current, { sn: current.length + 1, description: "", qty: 1, unitPrice: 0 }]);
  }

  function removeRow(index: number) {
    setItems((current) =>
      current.length > 1
        ? current
            .filter((_, i) => i !== index)
            .map((item, i) => ({ ...item, sn: i + 1 }))
        : current,
    );
  }

  return (
    <DashboardLayout
      title="Sales Quotation"
      subtitle={mode === "client" ? "Client quotation view with the same paper layout." : "A form-first quotation workspace with live paper preview."}
    >
      <div className="quotation-shell mx-auto max-w-[1480px]">
        <div className="quotation-toolbar mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-medium tracking-[-0.02em] ${isDark ? "text-white" : "text-[#04091A]"}`}>Create quotation</h2>
            <p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-[#04091A]/65"}`}>
              {mode === "client"
                ? "This view mirrors the paper the client receives, including totals, terms, and signatures."
                : "Fill the form on the left. The quotation paper on the right updates live."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-[#cad7f5] bg-white text-[#04091A] hover:bg-[#eef4ff]"
            }`}
          >
            <Printer size={16} /> Print paper
          </button>
        </div>

        <div className={`mb-5 flex flex-wrap gap-2 rounded-2xl border p-2 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-[#cad7f5] bg-white"}`}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  active
                    ? isDark
                      ? "bg-white text-[#070E26]"
                      : "bg-[#2645C8] text-white"
                    : isDark
                      ? "bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
                      : "bg-transparent text-[#04091A]/65 hover:bg-[#eef4ff] hover:text-[#04091A]"
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-7">
          {mode === "editor" ? (
            <section
              className={`quotation-form-panel rounded-[20px] border p-5 shadow-[0_30px_80px_rgba(0,0,0,.35)] ${
                isDark ? "border-white/10 bg-[#070E26] text-white" : "border-[#cad7f5] bg-white text-[#04091A]"
              }`}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-2xl font-medium tracking-[-0.03em] ${isDark ? "text-white" : "text-[#04091A]"}`}>New quotation</h3>
                  <p className={`mt-1 text-sm ${isDark ? "text-white/55" : "text-[#04091A]/65"}`}>Same form language as the orders screen, tuned for quotation entry.</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isDark ? "border-white/10 bg-white/5 text-white/80" : "border-[#cad7f5] bg-[#eef4ff] text-[#2645C8]"}`}>
                  <span className="text-lg font-black">D</span>
                </div>
              </div>

              <div className="space-y-5">
                {activeTab === "details" && (
                  <FormBlock title="Quotation details">
                    <div className="grid gap-4 md:grid-cols-2">
                      <LabelField label="Quotation no">
                        <input value={quotationNo} onChange={(e) => setQuotationNo(e.target.value)} placeholder="DPL-Q-0001" />
                      </LabelField>
                      <LabelField label="Date">
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      </LabelField>
                      <LabelField label="Client name">
                        <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Co." />
                      </LabelField>
                      <LabelField label="Party TIN">
                        <input value={partyTin} onChange={(e) => setPartyTin(e.target.value)} placeholder="e.g. 1020..." />
                      </LabelField>
                    </div>
                  </FormBlock>
                )}

                {activeTab === "items" && (
                  <FormBlock title="Items">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-white/55">Add all item lines that should appear on the paper.</p>
                      <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                      >
                        <Plus size={16} /> Add line
                      </button>
                    </div>

                    <div className="space-y-3">
                      {rows.map((item, index) => (
                        <div key={item.sn} className="grid gap-2 md:grid-cols-[1fr_92px_130px_38px]">
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(index, { description: e.target.value })}
                            placeholder="Description"
                          />
                          <input
                            value={item.qty}
                            onChange={(e) => updateItem(index, { qty: Math.max(0, Number(e.target.value || 0)) })}
                            placeholder="Qty"
                            inputMode="numeric"
                            className="text-right"
                          />
                          <input
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, { unitPrice: Math.max(0, Number(e.target.value || 0)) })}
                            placeholder="Unit price"
                            inputMode="numeric"
                            className="text-right"
                          />
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            aria-label="Remove line"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-transparent text-white/60 transition hover:bg-white/5 hover:text-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <SummaryPill label="Subtotal" value={`FRW ${formatMoney(subtotal)}`} />
                      <SummaryPill label="Inclusive 18% VAT" value={`FRW ${formatMoney(vat)}`} />
                      <SummaryPill label="Grand total" value={`FRW ${formatMoney(grandTotal)}`} />
                    </div>
                  </FormBlock>
                )}

                {activeTab === "signatures" && (
                  <FormBlock title="Signature library">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <SignatureUpload
                        label="Receiver signature"
                        value={receiverSignature}
                        onValueChange={setReceiverSignature}
                        onImport={receiverSig.importSignature}
                        asset={receiverSig.asset}
                      />
                      <SignatureUpload
                        label="Sender signature"
                        value={senderSignature}
                        onValueChange={setSenderSignature}
                        onImport={senderSig.importSignature}
                        asset={senderSig.asset}
                      />
                      <SignatureUpload
                        label="Client representative"
                        value={clientSignature}
                        onValueChange={setClientSignature}
                        onImport={clientSig.importSignature}
                        asset={clientSig.asset}
                      />
                    </div>
                  </FormBlock>
                )}

                {activeTab === "paper" && (
                  <FormBlock title="Live paper quick actions">
                    <div className="grid gap-3 md:grid-cols-3">
                      <SummaryPill label="Quotation no" value={quotationNo} />
                      <SummaryPill label="Client" value={clientName || "Not set"} />
                      <SummaryPill label="Amount" value={`FRW ${formatMoney(grandTotal)}`} />
                    </div>
                  </FormBlock>
                )}

                <FormBlock title="Quotation requirements">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReadOnlyList title="Capabilities">
                      {capabilities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ReadOnlyList>
                    <ReadOnlyList title="Methods of payment">
                      {paymentMethods.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ReadOnlyList>
                  </div>
                  <div className="mt-4 space-y-2">
                    <ReadOnlyList title="Terms & conditions">
                      {terms.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ReadOnlyList>
                  </div>
                </FormBlock>
              </div>
            </section>
          ) : (
            <section
              className={`rounded-[20px] border p-5 shadow-[0_30px_80px_rgba(0,0,0,.35)] ${
                isDark ? "border-white/10 bg-[#070E26] text-white" : "border-[#cad7f5] bg-white text-[#04091A]"
              }`}
            >
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <SummaryPill label="Quotation no" value={quotationNo} />
                  <SummaryPill label="Client" value={clientName || "Client view"} />
                  <SummaryPill label="Grand total" value={`FRW ${formatMoney(grandTotal)}`} />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <SummaryPill label="Date" value={prettyDate(date)} />
                  <SummaryPill label="Party TIN" value={partyTin || "Not set"} />
                  <SummaryPill label="VAT" value={`FRW ${formatMoney(vat)}`} />
                </div>
                {activeTab === "terms" && (
                  <ReadOnlyList title="Terms & conditions">
                    {terms.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ReadOnlyList>
                )}
                {activeTab === "payment" && (
                  <ReadOnlyList title="Methods of payment">
                    {paymentMethods.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ReadOnlyList>
                )}
                {activeTab === "signatures" && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <SignatureUpload label="Receiver signature" value={receiverSignature} onValueChange={setReceiverSignature} onImport={() => undefined} asset={receiverSig.asset} readOnly />
                    <SignatureUpload label="Sender signature" value={senderSignature} onValueChange={setSenderSignature} onImport={() => undefined} asset={senderSig.asset} readOnly />
                    <SignatureUpload label="Client representative" value={clientSignature} onValueChange={setClientSignature} onImport={() => undefined} asset={clientSig.asset} readOnly />
                  </div>
                )}
              </div>
            </section>
          )}

          <section
            className={`print-paper rounded-[18px] border p-4 shadow-[0_30px_80px_rgba(0,0,0,.35)] ${
              isDark ? "border-white/10 bg-white" : "border-[#cad7f5] bg-white"
            }`}
          >
            <div className="quotation-paper mx-auto max-w-[900px] text-black">
              <PaperPreview
                quotationNo={quotationNo}
                date={date}
                clientName={clientName}
                partyTin={partyTin}
                receiverSignature={receiverSignature}
                senderSignature={senderSignature}
                clientSignature={clientSignature}
                receiverAsset={receiverSig.asset}
                senderAsset={senderSig.asset}
                clientAsset={clientSig.asset}
                rows={rows}
                subtotal={subtotal}
                vat={vat}
                grandTotal={grandTotal}
                remarks={remarks}
              />
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .quotation-shell,
        .quotation-shell input,
        .quotation-shell select,
        .quotation-shell textarea {
          font-family: 'Inter', sans-serif;
        }

        .quotation-form-panel input,
        .quotation-form-panel select,
        .quotation-form-panel textarea {
          width: 100%;
          min-width: 0;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.96);
          padding: 14px 14px;
          font-size: 13px;
          outline: none;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }

        .quotation-form-panel input::placeholder,
        .quotation-form-panel textarea::placeholder {
          color: rgba(255,255,255,0.38);
        }

        .quotation-form-panel input:focus,
        .quotation-form-panel select:focus,
        .quotation-form-panel textarea:focus {
          border-color: rgba(0,198,255,0.55);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(0,198,255,0.09);
        }

        .quotation-form-panel textarea {
          resize: vertical;
          min-height: 120px;
        }

        .quotation-paper {
          aspect-ratio: 210 / 297;
          max-height: calc(100vh - 9rem);
          overflow: auto;
        }

        @media (max-width: 1279px) {
          .print-paper {
            position: static !important;
          }
          .quotation-paper {
            max-height: none;
          }
        }

        @media print {
          body {
            background: #fff !important;
          }
          .dl-sidebar,
          .quotation-toolbar,
          .quotation-form-panel,
          .quotation-shell > .mb-5 {
            display: none !important;
          }
          .dl-content {
            padding: 0 !important;
          }
          .print-paper {
            position: static !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .quotation-paper {
            max-width: none !important;
            aspect-ratio: auto !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-white/[0.03]" : "border-[#cad7f5] bg-[#f7fbff]"}`}>
      <div className="mb-3">
        <h4 className={`text-[11px] font-medium uppercase tracking-[0.16em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function LabelField({ label, children }: { label: string; children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <label className="block">
      <span className={`mb-2 block text-[11px] uppercase tracking-[0.12em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{label}</span>
      {children}
    </label>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border px-4 py-3 ${isDark ? "border-white/8 bg-black/10" : "border-[#cad7f5] bg-white"}`}>
      <div className={`text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white/40" : "text-[#04091A]/45"}`}>{label}</div>
      <div className={`mt-1 text-base font-medium ${isDark ? "text-white" : "text-[#04091A]"}`}>{value}</div>
    </div>
  );
}

function ReadOnlyList({ title, children }: { title: string; children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-black/10" : "border-[#cad7f5] bg-[#f7fbff]"}`}>
      <div className={`mb-3 text-[11px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{title}</div>
      <ul className={`space-y-2 text-sm leading-6 ${isDark ? "text-white/78" : "text-[#04091A]/78"}`}>{children}</ul>
    </div>
  );
}

function SignatureUpload({
  label,
  value,
  onValueChange,
  onImport,
  asset,
  readOnly,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onImport: (file: File | null) => void;
  asset: SignatureAsset;
  readOnly?: boolean;
}) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-black/10" : "border-[#cad7f5] bg-[#f7fbff]"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className={`text-[11px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{label}</div>
        {!readOnly && (
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-[#cad7f5] bg-white text-[#04091A] hover:bg-[#eef4ff]"}`}>
            <Upload size={14} />
            Import
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImport(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
      {asset?.dataUrl ? (
        <div className={`mb-3 rounded-xl border p-2 ${isDark ? "border-white/10 bg-white p-2" : "border-[#cad7f5] bg-white p-2"}`}>
          <img src={asset.dataUrl} alt={asset.name} className="h-24 w-full object-contain" />
        </div>
      ) : (
        <div className={`mb-3 flex h-24 items-center justify-center rounded-xl border border-dashed text-xs ${isDark ? "border-white/12 bg-white/[0.02] text-white/35" : "border-[#cad7f5] bg-[#f7fbff] text-[#04091A]/45"}`}>
          No signature image imported
        </div>
      )}
      {!readOnly ? (
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? "border-white/10 bg-white/5 text-white" : "border-[#cad7f5] bg-white text-[#04091A]"}`}
        >
          {SIGNATURE_OPTIONS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-white/10 bg-white/5 text-white" : "border-[#cad7f5] bg-white text-[#04091A]"}`}>{value}</div>
      )}
    </div>
  );
}

function PaperPreview({
  quotationNo,
  date,
  clientName,
  partyTin,
  receiverSignature,
  senderSignature,
  clientSignature,
  receiverAsset,
  senderAsset,
  clientAsset,
  rows,
  subtotal,
  vat,
  grandTotal,
  remarks,
}: {
  quotationNo: string;
  date: string;
  clientName: string;
  partyTin: string;
  receiverSignature: string;
  senderSignature: string;
  clientSignature: string;
  receiverAsset: SignatureAsset;
  senderAsset: SignatureAsset;
  clientAsset: SignatureAsset;
  rows: QuotationRow[];
  subtotal: number;
  vat: number;
  grandTotal: number;
  remarks: string;
}) {
  return (
    <article className="bg-white p-6 text-[13px] leading-6 text-black">
      <header className="grid gap-4 border-b-[5px] border-black pb-4 lg:grid-cols-[106px_1fr_250px]">
        <div className="flex items-start justify-center lg:justify-start">
          <div className="flex h-[88px] w-[88px] items-center justify-center rounded-sm bg-[#2645C8] text-[56px] font-black leading-none text-white">
            D
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-[34px] font-black tracking-[-0.03em] text-black">DUPLICATOR LTD.</h2>
          <p className="mt-1 text-[12px] font-black tracking-[0.28em] text-[#00AEEF]">PRINTING | BRANDING | SEWING</p>
          <div className="mt-4 inline-flex border-2 border-black px-10 py-2 text-[20px] font-black tracking-[-0.03em]">SALES QUOTATION</div>
          <p className="mt-3 text-[12px] font-bold">TIN/TVA: 102062874</p>
          <p className="mx-auto mt-1 max-w-[560px] text-[11px] font-semibold leading-5">
            Tel: (+250)788355226 | Email: duplicator10@gmail.com | P.O. Box 6332 Kigali / KN 78St 69
          </p>
        </div>
        <ul className="space-y-1 border-l-2 border-black pl-4 text-[11px] font-bold leading-5">
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </header>

      <section className="mt-5 grid gap-x-8 gap-y-2 text-[13px] md:grid-cols-2">
        <PaperField label="Quotation no" value={quotationNo} />
        <PaperField label="Date" value={prettyDate(date)} />
        <PaperField label="Client name" value={clientName || "________________"} />
        <PaperField label="Party TIN" value={partyTin || "________________"} />
      </section>

      <div className="mt-5 overflow-hidden rounded-[6px] border border-black">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-neutral-100">
              <th className="w-14 border border-black p-2 text-center font-black">S.N</th>
              <th className="border border-black p-2 text-left font-black">Description</th>
              <th className="w-14 border border-black p-2 text-center font-black">QTY</th>
              <th className="w-32 border border-black p-2 text-center font-black">Unit Price</th>
              <th className="w-36 border border-black p-2 text-center font-black">Amount (RWF)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sn}>
                <td className="border border-black p-2 text-center font-semibold">{row.sn}</td>
                <td className="border border-black p-2">{row.description || " "}</td>
                <td className="border border-black p-2 text-center">{row.qty || 0}</td>
                <td className="border border-black p-2 text-right">{formatMoney(row.unitPrice)}</td>
                <td className="border border-black p-2 text-right font-semibold">{formatMoney(row.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="border border-black p-2 font-bold" colSpan={4}>
                Inclusive 18% VAT
              </td>
              <td className="border border-black p-2 text-right font-bold">{formatMoney(vat)}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 text-right font-black" colSpan={4}>
                Grand total.
              </td>
              <td className="border border-black p-2 text-right text-[15px] font-black">{formatMoney(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section className="mt-4 rounded-[6px] border border-black p-4 text-[12px]">
        <h3 className="font-black">Terms & Conditions:</h3>
        <div className="mt-2 space-y-1 font-semibold leading-5">
          {terms.map((term) => (
            <p key={term}>{term}</p>
          ))}
        </div>
        <p className="mt-3 font-black">Amount in words: {amountInWords(grandTotal)}</p>
        {remarks.trim() && <p className="mt-2 font-semibold">Remarks: {remarks.trim()}</p>}
      </section>

      <footer className="mt-4 grid gap-3 text-[12px] md:grid-cols-3">
        <div className="min-h-36 border border-black p-3">
          <h3 className="mb-2 font-black">Methods of Payment:</h3>
          <div className="space-y-1 font-semibold leading-5">
            {paymentMethods.map((method) => (
              <p key={method}>{method}</p>
            ))}
          </div>
        </div>
        <SignaturePaper label="Receiver's Signature:" value={receiverSignature} asset={receiverAsset} />
        <SignaturePaper label="Sender's Signature:" value={senderSignature} asset={senderAsset} />
      </footer>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SignaturePaper label="Client's Signature:" value={clientSignature} asset={clientAsset} />
      </div>
    </article>
  );
}

function SignaturePaper({ label, value, asset }: { label: string; value: string; asset: SignatureAsset }) {
  return (
    <div className="flex min-h-36 flex-col justify-between border border-black p-3">
      <span className="font-black">{label}</span>
      <div>
        <div className="mb-2 flex h-14 items-center justify-center border border-dashed border-black/30 bg-black/5">
          {asset?.dataUrl ? (
            <img src={asset.dataUrl} alt={asset.name} className="h-12 w-full object-contain" />
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">No image imported</span>
          )}
        </div>
        <div className="border-b border-black" />
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/70">{value}</div>
      </div>
    </div>
  );
}

function PaperField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-1">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-black/50">{label}</span>
      <span className="max-w-[70%] text-right font-semibold text-black">{value}</span>
    </div>
  );
}
