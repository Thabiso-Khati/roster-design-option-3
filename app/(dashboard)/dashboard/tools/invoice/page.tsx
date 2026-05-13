"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/context/locale-context";
import { Plus, Trash2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { ExportButton } from "@/components/ui/export-button";

const CURRENCIES = ["AOA","DZD","EGP","ETB","GHS","KES","MAD","NGN","TZS","UGX","XAF","XOF","ZAR","EUR","GBP","USD"];
const CURRENCY_SYMBOLS: Record<string,string> = {
  AOA:"Kz", DZD:"DA",  EGP:"E£", ETB:"Br",  GHS:"GH₵",
  KES:"KSh",MAD:"MAD", NGN:"₦",  TZS:"TSh", UGX:"USh",
  XAF:"FCFA",XOF:"CFA",ZAR:"R",  EUR:"€",   GBP:"£",   USD:"$"
};
const SYM: Record<string,string> = { ZAR:"R",NGN:"₦",KES:"KSh",GHS:"GH₵",USD:"$",GBP:"£",EUR:"€" };
const uid = () => Math.random().toString(36).slice(2,7);

interface LineItem { id: string; description: string; qty: number; rate: number; }

export default function InvoicePage() {
  const { currency: profileCurrency, sym: profileSym } = useLocale();
  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0];

  const [currency, setCurrency] = useState(profileCurrency);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [due, setDue]               = useState(dueDate);
  const [vatRate, setVatRate]       = useState(0);

  // From (your business)
  const [fromName,   setFromName]   = useState("");
  const [fromEmail,  setFromEmail]  = useState("");
  const [fromPhone,  setFromPhone]  = useState("");
  const [fromAddress,setFromAddress]= useState("");

  // To (client)
  const [toName,    setToName]    = useState("");
  const [toEmail,   setToEmail]   = useState("");
  const [toAddress, setToAddress] = useState("");

  // Capture ALL fields for saving
  const getInvoiceData = () => ({
    currency, invoiceNo, invoiceDate, due, vatRate,
    fromName, fromEmail, fromPhone, fromAddress,
    toName, toEmail, toAddress,
    notes, items,
  });

  // Sync currency from profile (only if no saved snapshot has loaded)
  useEffect(() => {
    setCurrency(profileCurrency);
  }, [profileCurrency]);

  // ── Load saved snapshot on mount ─────────────────────────────
  useEffect(() => {
    fetch("/api/tools/save?slug=invoice")
      .then(r => r.json())
      .then(({ snapshot }) => {
        if (!snapshot?.data) return;
        const d = snapshot.data as Record<string, unknown>;
        if (d.currency)           setCurrency(d.currency as string);
        if (d.invoiceNo)          setInvoiceNo(d.invoiceNo as string);
        if (d.invoiceDate)        setInvoiceDate(d.invoiceDate as string);
        if (d.due)                setDue(d.due as string);
        if (d.vatRate != null)    setVatRate(d.vatRate as number);
        if (d.fromName)           setFromName(d.fromName as string);
        if (d.fromEmail)          setFromEmail(d.fromEmail as string);
        if (d.fromPhone)          setFromPhone(d.fromPhone as string);
        if (d.fromAddress)        setFromAddress(d.fromAddress as string);
        if (d.toName)             setToName(d.toName as string);
        if (d.toEmail)            setToEmail(d.toEmail as string);
        if (d.toAddress)          setToAddress(d.toAddress as string);
        if (d.notes)              setNotes(d.notes as string);
        if (Array.isArray(d.items) && d.items.length > 0)
                                  setItems(d.items as LineItem[]);
      })
      .catch(() => {}); // silently ignore — tool works fine without saved data
  }, []);

  const [notes, setNotes] = useState("Payment due within 30 days. EFT to the account details above.");

  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "", qty: 1, rate: 0 },
  ]);

  const addItem = () => setItems(p => [...p, { id: uid(), description: "", qty: 1, rate: 0 }]);
  const removeItem = (id: string) => setItems(p => p.filter(i => i.id !== id));
  const updateItem = (id: string, k: keyof LineItem, v: string|number) =>
    setItems(p => p.map(i => i.id === id ? {...i,[k]:v} : i));

  const subtotal = items.reduce((s,i) => s + (i.qty * i.rate), 0);
  const vat      = subtotal * (vatRate / 100);
  const total    = subtotal + vat;
  const sym      = SYM[currency] || currency;

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const rows = [
      ["INVOICE", invoiceNo],
      ["Date", invoiceDate],
      ["Due", due],
      ["From", fromName, fromEmail],
      ["To", toName, toEmail],
      [],
      ["Description", "Qty", "Rate", "Amount"],
      ...items.map(i => [i.description, i.qty, i.rate, i.qty*i.rate]),
      [],
      ["Subtotal", "", "", subtotal],
      vatRate > 0 ? [`VAT (${vatRate}%)`, "", "", vat] : [],
      ["TOTAL", "", "", total],
    ].filter(r => r.length > 0);
    const csv = rows.map(r => r.map(v=>`"${v}"`).join(",")).join("\n");
    const a = Object.assign(document.createElement("a"),{
      href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})),
      download: `${invoiceNo}.csv`,
    });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const inputCls = "w-full bg-surface-2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted";

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-text-primary">Invoice Builder</h1>
          <p className="text-text-muted mt-1 text-sm">Create professional invoices in seconds.</p>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton toolSlug="invoice" getData={getInvoiceData} title={`Invoice ${invoiceNo} — ${invoiceDate}`} />
            <ExportButton onPDF={handlePrint} onCSV={handleCSV} />
          
        </div>
      </div>

      {/* Invoice meta */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Invoice #</label>
            <input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)} className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)} className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Due Date</label>
            <input type="date" value={due} onChange={e=>setDue(e.target.value)} className={inputCls}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Currency</label>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} className={inputCls}>
              {[{code:"",label:"Currency"},...CURRENCIES.map(c=>({code:c,label:c}))].map(({code,label})=><option key={code} value={code} disabled={code===""}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs font-bold text-brand uppercase tracking-widest mb-3">From (You)</p>
          <div className="space-y-2.5">
            <input value={fromName} onChange={e=>setFromName(e.target.value)} placeholder="Business / Your Name" className={inputCls}/>
            <input value={fromEmail} onChange={e=>setFromEmail(e.target.value)} placeholder="Email" className={inputCls}/>
            <input value={fromPhone} onChange={e=>setFromPhone(e.target.value)} placeholder="Phone / WhatsApp" className={inputCls}/>
            <textarea value={fromAddress} onChange={e=>setFromAddress(e.target.value)} placeholder="Address & bank details" rows={3}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none"/>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Bill To (Client)</p>
          <div className="space-y-2.5">
            <input value={toName} onChange={e=>setToName(e.target.value)} placeholder="Client Name / Company" className={inputCls}/>
            <input value={toEmail} onChange={e=>setToEmail(e.target.value)} placeholder="Client Email" className={inputCls}/>
            <textarea value={toAddress} onChange={e=>setToAddress(e.target.value)} placeholder="Client Address" rows={3}
              className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none"/>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Services / Items</p>
        <div className="mb-2 grid grid-cols-12 gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-right">Rate ({sym})</span>
          <span className="col-span-2 text-right">Amount</span>
        </div>
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
            <input value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)}
              placeholder="e.g. Artist management fee, April 2025"
              className="col-span-6 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted"/>
            <input type="number" min="1" value={item.qty} onChange={e=>updateItem(item.id,"qty",Number(e.target.value))}
              className="col-span-2 bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-text-primary text-center"/>
            <input type="number" min="0" value={item.rate||""} onChange={e=>updateItem(item.id,"rate",Number(e.target.value))}
              placeholder="0"
              className="col-span-2 bg-surface-2 border border-border rounded-lg px-2 py-2 text-xs text-text-primary text-right"/>
            <div className="col-span-1 text-right text-xs font-semibold text-text-primary">
              {sym}{(item.qty*item.rate).toLocaleString()}
            </div>
            <button onClick={()=>removeItem(item.id)} className="col-span-1 p-1 text-text-muted hover:text-error transition-all flex justify-center">
              <Trash2 size={12}/>
            </button>
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-1.5 text-xs font-semibold text-brand mt-3">
          <Plus size={12}/>Add item
        </button>
      </div>

      {/* Totals */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="max-w-xs ml-auto space-y-2">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-text-primary">{sym}{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <span>VAT</span>
              <input type="number" min="0" max="100" value={vatRate} onChange={e=>setVatRate(Number(e.target.value))}
                className="w-12 bg-surface-2 border border-border rounded px-2 py-0.5 text-xs text-text-primary text-center"/>
              <span>%</span>
            </div>
            <span className="font-semibold text-text-primary">{sym}{vat.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <span className="font-black text-text-primary">TOTAL DUE</span>
            <span className="font-black text-xl text-brand">{sym}{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="glass-card rounded-xl p-5">
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Notes / Payment Instructions</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary resize-none"/>
      </div>
    </div>
  );
}
