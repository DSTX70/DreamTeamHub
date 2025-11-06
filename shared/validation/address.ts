export type AddressInput = {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
  phone?: string;
};

export type FieldErrors = Partial<Record<keyof AddressInput, string>>;

const US_STATE = /^(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV)$/i;
const US_POSTAL = /^\d{5}(?:-\d{4})?$/;
const CA_POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
const PHONE_DIGITS = /\D+/g;

export function normalizePhone(phone?: string) {
  if (!phone) return "";
  const digits = phone.replace(PHONE_DIGITS, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

export function validateAddress(a: AddressInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!a.name?.trim()) errors.name = "Name is required";
  if (!a.line1?.trim()) errors.line1 = "Address line 1 is required";
  if (!a.city?.trim()) errors.city = "City is required";
  if (!a.country?.trim()) errors.country = "Country is required";
  if (!a.postal?.trim()) errors.postal = "Postal code is required";

  const country = (a.country || "").toUpperCase();
  const region = (a.region || "").toUpperCase();
  const postal = (a.postal || "").toUpperCase();

  if (country === "US") {
    if (region && !US_STATE.test(region)) errors.region = "Use two-letter state code (e.g., AZ)";
    if (postal && !US_POSTAL.test(postal)) errors.postal = "ZIP must be 12345 or 12345-6789";
  } else if (country === "CA") {
    if (postal && !CA_POSTAL.test(postal)) errors.postal = "Use format A1A 1A1";
  }

  const normPhone = normalizePhone(a.phone);
  if (a.phone && normPhone.length < 10) errors.phone = "Enter a valid phone number";

  return errors;
}
