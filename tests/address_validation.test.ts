import { validateAddress, normalizePhone } from "../shared/validation/address";

test("US ZIP + state validation", () => {
  const errs = validateAddress({ name:"A", line1:"L1", city:"Phoenix", region:"AZ", postal:"85001", country:"US" });
  expect(Object.keys(errs).length).toBe(0);
  const bad = validateAddress({ name:"A", line1:"L1", city:"Phoenix", region:"Arizona", postal:"8500", country:"US" });
  expect(bad.region).toBeTruthy();
  expect(bad.postal).toBeTruthy();
});

test("CA postal validation", () => {
  const errs = validateAddress({ name:"A", line1:"L1", city:"Toronto", postal:"M5V 2T6", country:"CA" });
  expect(Object.keys(errs).length).toBe(0);
});

test("phone normalization", () => {
  expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
  expect(normalizePhone("+1 555-123-4567")).toBe("5551234567");
});
