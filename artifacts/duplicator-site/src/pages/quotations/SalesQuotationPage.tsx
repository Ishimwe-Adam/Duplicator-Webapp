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
  { id: "paper", label: "Paper only", icon: FileText },
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

  const showEditStrip = activeTab !== "paper";

  return (
    <DashboardLayout
      title="Sales Quotation"
      subtitle={mode === "client" ? "Client quotation view with paper layout." : "Edit fields via the tabs below, then print the paper."}
    >
      <div className="quotation-shell mx-auto max-w-[860px]">
        <div className="quotation-toolbar mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-lg font-medium tracking-[-0.02em] ${isDark ? "text-white" : "text-[#04091A]"}`}>
              {mode === "client" ? "Your quotation" : "Create quotation"}
            </h2>
            <p className={`mt-0.5 text-sm ${isDark ? "text-white/55" : "text-[#04091A]/65"}`}>
              {mode === "client"
                ? "This is the paper you receive. Switch tabs to see terms, payment and signatures."
                : "Select a tab to edit fields. The paper below updates live."}
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

        <div className={`quotation-tabs mb-4 flex flex-wrap gap-2 rounded-2xl border p-2 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-[#cad7f5] bg-white"}`}>
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

        {showEditStrip && (
          <div className={`quotation-edit-strip mb-4 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-[#070E26]" : "border-[#cad7f5] bg-white"}`}>
            {mode === "editor" && activeTab === "details" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            )}

            {mode === "editor" && activeTab === "items" && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className={`text-xs ${isDark ? "text-white/55" : "text-[#04091A]/55"}`}>Add all item lines that appear on the paper.</span>
                  <button
                    type="button"
                    onClick={addRow}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      isDark ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-[#cad7f5] bg-white text-[#04091A] hover:bg-[#eef4ff]"
                    }`}
                  >
                    <Plus size={14} /> Add line
                  </button>
                </div>
                <div className="space-y-2">
                  {rows.map((item, index) => (
                    <div key={item.sn} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_36px]">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                        placeholder={`Item ${item.sn} description`}
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
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                          isDark ? "border-white/10 bg-white/5 text-white/60 hover:bg-white/10" : "border-[#cad7f5] bg-white text-[#04091A]/60 hover:bg-[#eef4ff]"
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <SummaryPill label="Subtotal" value={`FRW ${formatMoney(subtotal)}`} />
                  <SummaryPill label="18% VAT" value={`FRW ${formatMoney(vat)}`} />
                  <SummaryPill label="Grand total" value={`FRW ${formatMoney(grandTotal)}`} />
                </div>
              </div>
            )}

            {mode === "editor" && activeTab === "signatures" && (
              <div className="grid gap-4 md:grid-cols-3">
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
            )}

            {mode === "client" && activeTab === "terms" && (
              <ReadOnlyList title="Terms & conditions">
                {terms.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ReadOnlyList>
            )}

            {mode === "client" && activeTab === "payment" && (
              <ReadOnlyList title="Methods of payment">
                {paymentMethods.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ReadOnlyList>
            )}

            {mode === "client" && activeTab === "signatures" && (
              <div className="grid gap-4 md:grid-cols-3">
                <SignatureUpload label="Receiver signature" value={receiverSignature} onValueChange={setReceiverSignature} onImport={() => undefined} asset={receiverSig.asset} readOnly />
                <SignatureUpload label="Sender signature" value={senderSignature} onValueChange={setSenderSignature} onImport={() => undefined} asset={senderSig.asset} readOnly />
                <SignatureUpload label="Client representative" value={clientSignature} onValueChange={setClientSignature} onImport={() => undefined} asset={clientSig.asset} readOnly />
              </div>
            )}
          </div>
        )}

        <section className="print-paper mx-auto overflow-hidden rounded-[18px] border border-[#cad7f5] bg-white shadow-[0_30px_80px_rgba(0,0,0,.22)] print:m-0 print:border-none print:shadow-none">
          <div className="quotation-paper mx-auto w-[210mm] min-h-[297mm] text-black">
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

      <style>{`
        .quotation-shell,
        .quotation-shell input,
        .quotation-shell select,
        .quotation-shell textarea {
          font-family: 'Inter', sans-serif;
        }

        .quotation-edit-strip input,
        .quotation-edit-strip select,
        .quotation-edit-strip textarea {
          width: 100%;
          min-width: 0;
          border-radius: 12px;
          border: 1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#cad7f5"};
          background: ${isDark ? "rgba(255,255,255,0.04)" : "#f7fbff"};
          color: ${isDark ? "rgba(255,255,255,0.96)" : "#04091A"};
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }

        .quotation-edit-strip input::placeholder,
        .quotation-edit-strip textarea::placeholder {
          color: ${isDark ? "rgba(255,255,255,0.32)" : "rgba(4,9,26,0.35)"};
        }

        .quotation-edit-strip input:focus,
        .quotation-edit-strip select:focus {
          border-color: rgba(0,198,255,0.55);
          box-shadow: 0 0 0 3px rgba(0,198,255,0.09);
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
          }
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
          }
          .dl-sidebar,
          header,
          .quotation-toolbar,
          .quotation-tabs,
          .quotation-edit-strip,
          .dl-mobile-only,
          .dl-desktop-only {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .dl-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .quotation-shell {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          .quotation-paper {
            width: 210mm !important;
            height: 297mm !important;
            padding: 10mm !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

function LabelField({ label, children }: { label: string; children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <label className="block">
      <span className={`mb-1.5 block text-[10px] uppercase tracking-[0.12em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{label}</span>
      {children}
    </label>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-xl border px-3 py-2 ${isDark ? "border-white/8 bg-black/10" : "border-[#cad7f5] bg-[#f7fbff]"}`}>
      <div className={`text-[9px] uppercase tracking-[0.14em] ${isDark ? "text-white/40" : "text-[#04091A]/45"}`}>{label}</div>
      <div className={`mt-0.5 text-sm font-medium ${isDark ? "text-white" : "text-[#04091A]"}`}>{value}</div>
    </div>
  );
}

function ReadOnlyList({ title, children }: { title: string; children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? "border-white/8 bg-black/10" : "border-[#cad7f5] bg-[#f7fbff]"}`}>
      <div className={`mb-2 text-[11px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{title}</div>
      <ul className={`space-y-1.5 text-sm leading-5 ${isDark ? "text-white/78" : "text-[#04091A]/78"}`}>{children}</ul>
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
    <div className={`rounded-2xl border p-3 ${isDark ? "border-white/8 bg-black/10" : "border-[#cad7f5] bg-[#f7fbff]"}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className={`text-[10px] uppercase tracking-[0.14em] ${isDark ? "text-white/45" : "text-[#04091A]/55"}`}>{label}</div>
        {!readOnly && (
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] transition ${isDark ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10" : "border-[#cad7f5] bg-white text-[#04091A] hover:bg-[#eef4ff]"}`}>
            <Upload size={12} />
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
        <div className="mb-2 rounded-xl border border-[#cad7f5] bg-white p-1.5">
          <img src={asset.dataUrl} alt={asset.name} className="h-16 w-full object-contain" />
        </div>
      ) : (
        <div className={`mb-2 flex h-16 items-center justify-center rounded-xl border border-dashed text-[10px] ${isDark ? "border-white/12 bg-white/[0.02] text-white/35" : "border-[#cad7f5] bg-[#f7fbff] text-[#04091A]/45"}`}>
          No signature imported
        </div>
      )}
      {!readOnly ? (
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={`w-full rounded-xl border px-3 py-2 text-xs outline-none ${isDark ? "border-white/10 bg-white/5 text-white" : "border-[#cad7f5] bg-white text-[#04091A]"}`}
        >
          {SIGNATURE_OPTIONS.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <div className={`rounded-xl border px-3 py-2 text-xs ${isDark ? "border-white/10 bg-white/5 text-white" : "border-[#cad7f5] bg-white text-[#04091A]"}`}>{value}</div>
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
    <article className="flex flex-col h-full bg-white px-[12mm] py-[10mm] text-[11px] leading-5 text-black">
      <header className="grid gap-3 border-b-[4px] border-black pb-3 grid-cols-[72px_1fr_200px]">
        <div className="flex items-start justify-start">
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-sm bg-[#2645C8] text-[38px] font-black leading-none text-white">
            D
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-[22px] font-black tracking-[-0.03em] text-black">DUPLICATOR LTD.</h2>
          <p className="mt-0.5 text-[9px] font-black tracking-[0.22em] text-[#00AEEF]">PRINTING | BRANDING | SEWING</p>
          <div className="mt-2 inline-flex border-2 border-black px-6 py-0.5 text-[12px] font-black tracking-[-0.02em]">SALES QUOTATION</div>
          <p className="mt-1.5 text-[9px] font-bold">TIN/TVA: 102062874</p>
          <p className="mx-auto mt-0.5 max-w-[480px] text-[9px] font-semibold leading-4">
            Tel: (+250)788355226 | Email: duplicator10@gmail.com | P.O. Box 6332 Kigali / KN 78St 69
          </p>
        </div>
        <ul className="space-y-0.5 border-l-2 border-black pl-3 text-[8.5px] font-bold leading-[1.3]">
          {capabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </header>

      <section className="mt-5 grid gap-x-12 gap-y-1.5 text-[11px] md:grid-cols-2">
        <PaperField label="Quotation no" value={quotationNo} />
        <PaperField label="Date" value={prettyDate(date)} />
        <PaperField label="Client name" value={clientName || "________________"} />
        <PaperField label="Party TIN" value={partyTin || "________________"} />
      </section>

      <div className="mt-6 flex-grow">
        <div className="overflow-hidden rounded-[4px] border border-black">
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-neutral-100">
                <th className="w-10 border border-black p-2 text-center font-black">S.N</th>
                <th className="border border-black p-2 text-left font-black">Description</th>
                <th className="w-14 border border-black p-2 text-center font-black">QTY</th>
                <th className="w-28 border border-black p-2 text-center font-black">Unit Price</th>
                <th className="w-32 border border-black p-2 text-center font-black">Amount (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.sn}>
                  <td className="border border-black p-2 text-center font-semibold">{row.sn}</td>
                  <td className="border border-black p-2">{row.description || "\u00A0"}</td>
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
              <tr className="bg-neutral-50">
                <td className="border border-black p-2 text-right font-black" colSpan={4}>
                  GRAND TOTAL
                </td>
                <td className="border border-black p-2 text-right text-[12px] font-black">{formatMoney(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mt-5 rounded-[4px] border border-black p-4 text-[10px]">
          <h3 className="font-black uppercase tracking-wider text-[11px] mb-2">Terms & Conditions:</h3>
          <div className="space-y-1 font-semibold leading-relaxed">
            {terms.map((term) => (
              <p key={term} className="flex gap-2"><span>•</span> {term}</p>
            ))}
          </div>
          <p className="mt-4 font-black text-[11px]">Amount in words: <span className="uppercase">{amountInWords(grandTotal)}</span></p>
          {remarks.trim() && <p className="mt-2 font-semibold italic">Remarks: {remarks.trim()}</p>}
        </section>
      </div>

      <div className="mt-auto pt-6">
        <footer className="grid gap-3 text-[10px] grid-cols-3">
          <div className="min-h-[90px] border border-black p-3">
            <h3 className="mb-2 font-black uppercase text-[9px] tracking-wider">Methods of Payment:</h3>
            <div className="space-y-1 font-semibold leading-relaxed">
              {paymentMethods.map((method) => (
                <p key={method}>{method}</p>
              ))}
            </div>
          </div>
          <SignaturePaper label="Receiver's Signature:" value={receiverSignature} asset={receiverAsset} />
          <SignaturePaper label="Sender's Signature:" value={senderSignature} asset={senderAsset} />
        </footer>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <SignaturePaper label="Client's Signature:" value={clientSignature} asset={clientAsset} />
          <div className="col-span-2 flex items-center justify-end">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2645C8]">Switch Your Brand ON</p>
              <p className="text-[8px] font-bold text-neutral-400 mt-0.5">Design & Printing Solution</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SignaturePaper({ label, value, asset }: { label: string; value: string; asset: SignatureAsset }) {
  return (
    <div className="flex min-h-[72px] flex-col justify-between border border-black p-2">
      <span className="text-[10px] font-black">{label}</span>
      <div>
        <div className="mb-1 flex h-9 items-center justify-center border border-dashed border-black/30 bg-black/5">
          {asset?.dataUrl ? (
            <img src={asset.dataUrl} alt={asset.name} className="h-8 w-full object-contain" />
          ) : (
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-black/45">No image</span>
          )}
        </div>
        <div className="border-b border-black" />
        <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-black/70">{value}</div>
      </div>
    </div>
  );
}

function PaperField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-0.5">
      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-black/50">{label}</span>
      <span className="max-w-[70%] text-right text-[10px] font-semibold text-black">{value}</span>
    </div>
  );
}
