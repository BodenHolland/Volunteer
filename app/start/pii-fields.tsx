"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressAutocompleteAction, type AddressSuggestion } from "./actions";

/**
 * Formats raw digits into the US phone shape `(XXX) XXX-XXXX`. We strip
 * everything non-numeric on each keystroke and rebuild, so paste, backspace,
 * and mid-string edits all stay tidy. Caret handling is deliberately simple —
 * the cursor jumps to the end after each format pass, which is fine for the
 * onboarding flow (people type top-to-bottom).
 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function PhoneInput({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(formatPhone(defaultValue));
  return (
    <Input
      id="phone"
      name="phone"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      leadingIcon={<Phone />}
      required
      value={value}
      placeholder="(916) 555-0142"
      onChange={(e) => setValue(formatPhone(e.target.value))}
    />
  );
}

/**
 * Street address with autocomplete suggestions powered by OpenStreetMap
 * Nominatim (free, US-scoped). The user types in `line1`; after 350ms of idle
 * we fetch up to 5 matches and render a dropdown. Clicking a suggestion fills
 * line1, city, state, and zip — state still lives in a hidden field so the
 * server action sees it (the PII step doesn't render a state control of its
 * own; the user picked it back on the location step).
 *
 * Falls back silently to a plain input on network / Nominatim failure.
 */
export function AddressFields({
  defaultLine1,
  defaultLine2,
  defaultCity,
  defaultState,
  defaultZip,
}: {
  defaultLine1: string;
  defaultLine2: string;
  defaultCity: string;
  defaultState: string;
  defaultZip: string;
}) {
  const [line1, setLine1] = useState(defaultLine1);
  const [line2, setLine2] = useState(defaultLine2);
  const [city, setCity] = useState(defaultCity);
  const [stateCode, setStateCode] = useState(defaultState);
  const [zip, setZip] = useState(defaultZip);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedRef = useRef<string>("");

  useEffect(() => {
    const q = line1.trim();
    // Only autocomplete once the user has typed something with a number + a
    // word in it — avoids burning Nominatim quota on "1" or "main".
    if (q.length < 6 || q === lastFetchedRef.current) {
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      lastFetchedRef.current = q;
      const list = await addressAutocompleteAction(q);
      if (!cancelled) setSuggestions(list);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [line1]);

  function applySuggestion(s: AddressSuggestion) {
    setLine1(s.line1 || s.display);
    if (s.city) setCity(s.city);
    if (s.state) setStateCode(s.state);
    if (s.zip) setZip(s.zip);
    setOpen(false);
    setSuggestions([]);
    // Block the next autocomplete fetch — applying a suggestion shouldn't
    // immediately re-query for the now-completed string.
    lastFetchedRef.current = s.line1 || s.display;
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="line1">Street address</Label>
        <div className="relative">
          <Input
            id="line1"
            name="line1"
            required
            value={line1}
            autoComplete="address-line1"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setLine1(e.target.value);
              setOpen(true);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => {
              // Delay so clicks on a suggestion register before we close.
              blurTimeout.current = setTimeout(() => setOpen(false), 150);
            }}
          />
          {open && suggestions.length > 0 ? (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-white shadow-lg">
              {suggestions.map((s, i) => (
                <li key={`${s.place_id}-${i}`}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-section"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (blurTimeout.current) clearTimeout(blurTimeout.current);
                      applySuggestion(s);
                    }}
                  >
                    <div className="font-medium text-ink">{s.line1 || s.display}</div>
                    <div className="text-xs text-meta">
                      {[s.city, s.state, s.zip].filter(Boolean).join(", ")}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="line2">Apt / unit</Label>
          <Input
            id="line2"
            name="line2"
            value={line2}
            autoComplete="address-line2"
            onChange={(e) => setLine2(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city2">City</Label>
          <Input
            id="city2"
            name="city"
            value={city}
            autoComplete="address-level2"
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zip">ZIP</Label>
          <Input
            id="zip"
            name="zip"
            required
            value={zip}
            autoComplete="postal-code"
            inputMode="numeric"
            onChange={(e) => setZip(e.target.value)}
          />
        </div>
      </div>
      <input type="hidden" name="state" value={stateCode} />
    </>
  );
}
