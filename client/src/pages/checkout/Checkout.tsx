import React from "react";

type Address = {
  id?: string;
  label?: string;
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
};

type FieldErrors = Partial<Record<keyof Address, string>>;

export default function Checkout() {
  const [addr, setAddr] = React.useState<Address>({ country: "US" });
  const [saved, setSaved] = React.useState<Address[]>([]);
  const [errs, setErrs] = React.useState<FieldErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const d = await (await fetch("/api/checkout/address/default")).json();
      if (d?.address) setAddr(d.address);
      const list = await (await fetch("/api/account/addresses")).json();
      setSaved(list);
    };
    load();
  }, []);

  const pick = (id?: string) => {
    const a = saved.find(s => s.id === id);
    if (a) setAddr(a);
  };

  const change = (k: keyof Address, v: any) => setAddr(prev => ({ ...prev, [k]: v }));

  const validate = async () => {
    const r = await fetch("/api/checkout/address/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addr) });
    if (r.status === 422) {
      const j = await r.json(); setErrs(j.errors || {}); return false;
    }
    const j = await r.json();
    if (j?.normalized?.phone) setAddr(prev => ({ ...prev, phone: j.normalized.phone }));
    setErrs({}); return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate())) return;
    setSubmitting(true);
    try {
      // TODO: proceed with payment or next-step call
      alert("Checkout info accepted");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ name, label, placeholder, type="text" }:{ name: keyof Address; label: string; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type={type}
        className={"border p-2 rounded w-full " + (errs[name] ? "border-red-500" : "")}
        value={(addr[name] as any) ?? ""}
        placeholder={placeholder}
        onChange={(e)=>change(name, e.target.value)}
      />
      {errs[name] && <div className="text-xs text-red-600 mt-1">{errs[name]}</div>}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">Checkout</h1>

      <div>
        <label className="block text-sm mb-1">Saved addresses</label>
        <div className="flex flex-wrap gap-2">
          {saved.map(s => (
            <button key={s.id} type="button"
              className={"px-3 py-1 rounded border " + (addr.id===s.id ? "bg-gray-200" : "bg-white")}
              onClick={()=>pick(s.id)}>
              {s.label || "Address"}{s.isDefault ? " • Default" : ""}
            </button>
          ))}
        </div>
      </div>

      <form className="grid grid-cols-2 gap-4" onSubmit={submit}>
        <Field name="name" label="Full Name" />
        <Field name="phone" label="Phone" />
        <Field name="line1" label="Address line 1" className="" />
        <Field name="line2" label="Address line 2" />
        <Field name="city" label="City" />
        <Field name="region" label="State/Region" placeholder="e.g., AZ" />
        <Field name="postal" label="Postal Code" />
        <Field name="country" label="Country" placeholder="US / CA ..." />
        <div className="col-span-2">
          <button className="px-4 py-2 border rounded" disabled={submitting} type="submit">
            {submitting ? "Submitting…" : "Use this address"}
          </button>
        </div>
      </form>
    </div>
  );
}
