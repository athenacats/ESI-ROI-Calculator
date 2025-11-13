import React, { useMemo, useState } from "react";

// ESI Channel Partner ROI Calculator
// Drop-in React component. TailwindCSS recommended for styling.
// Defaults: $1,200 management fee per WSE; 15% standard CP commission.
// Supports up to 5 book-commission tiers, WSE estimation, conversion slider,
// and scenario section with a static Standard CP card + an adjustable Custom Commission card.

const currencyFmt = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const pctFmt = (n: number | string) => `${(Number(n) || 0).toFixed(1)}%`;

function numberFromInput(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export default function EsiChannelPartnerRoiCalculator() {
  // ===== Current Book inputs =====
  const [tiers, setTiers] = useState<Array<{ label: string; amount: number; pct: number }>>([
    { label: "Tier 1", amount: 250000, pct: 5 }, // => Book = $12,500
  ]);

  // ===== ESI Opportunity inputs =====
  const [inputMode, setInputMode] = useState<"byClients" | "byWSE">("byClients");
  const [clients, setClients] = useState(20);
  const [avgWsePerClient, setAvgWsePerClient] = useState(18);
  const [totalWseDirect, setTotalWseDirect] = useState(360);
  const [avgAnnualWage, setAvgAnnualWage] = useState(55000);
  const [mgmtFeePerWse, setMgmtFeePerWse] = useState(1200);
  const [conversionRate, setConversionRate] = useState(25); // % of WSE that move onto ESI

  // Custom commission controls (for adjustable card)
  const [customCommissionPct, setCustomCommissionPct] = useState(15); // starts at 15%
  const [bookPortionPct, setBookPortionPct] = useState(100); // % of base/current book to include

  // ===== Derived values =====
  const totalBookCommission = useMemo(() => {
    return tiers.reduce(
      (sum, t) => sum + numberFromInput(t.amount) * (numberFromInput(t.pct) / 100),
      0
    );
  }, [tiers]);

  const totalWse = useMemo(() => {
    return inputMode === "byClients"
      ? numberFromInput(clients) * numberFromInput(avgWsePerClient)
      : numberFromInput(totalWseDirect);
  }, [inputMode, clients, avgWsePerClient, totalWseDirect]);

  const convertedWse = useMemo(() => {
    return Math.round(totalWse * (numberFromInput(conversionRate) / 100));
  }, [totalWse, conversionRate]);

  const totalPayroll = useMemo(() => {
    return numberFromInput(totalWse) * numberFromInput(avgAnnualWage);
  }, [totalWse, avgAnnualWage]);

  const grossMgmtFee = useMemo(() => {
    return convertedWse * numberFromInput(mgmtFeePerWse);
  }, [convertedWse, mgmtFeePerWse]);

  const commissionFromRate = (ratePct: number) => grossMgmtFee * (numberFromInput(ratePct) / 100);

  // Custom (adjustable) scenario
  const customCommission = commissionFromRate(customCommissionPct);
  const adjustedBook = totalBookCommission * (numberFromInput(bookPortionPct) / 100);
  const customTotalRevenue = customCommission + adjustedBook;
  const customMgmtSharePct = customTotalRevenue > 0 ? (customCommission / customTotalRevenue) * 100 : NaN;
  const customBookSharePct = customTotalRevenue > 0 ? (adjustedBook / customTotalRevenue) * 100 : NaN;
  const customUpliftAbs = customTotalRevenue - totalBookCommission; // vs full base book
  const customUpliftPct = totalBookCommission > 0 ? (customUpliftAbs / totalBookCommission) * 100 : NaN;
  const perClientAddedRevCustom = clients ? customCommission / numberFromInput(clients) : 0;

  // Static Standard CP card (as requested): $21,600 mgmt fee + $12,500 book
  const STATIC_CP_MGMT = 21600;
  const STATIC_CP_BOOK = 12500;
  const STATIC_CP_TOTAL = STATIC_CP_MGMT + STATIC_CP_BOOK; // 34,100
  const STATIC_CP_UPLIFT_ABS = STATIC_CP_TOTAL - STATIC_CP_BOOK; // 21,600
  const STATIC_CP_UPLIFT_PCT = (STATIC_CP_UPLIFT_ABS / STATIC_CP_BOOK) * 100; // 172.8%
  const STATIC_CP_MGMT_SHARE = (STATIC_CP_MGMT / STATIC_CP_TOTAL) * 100; // ≈63.3%
  const STATIC_CP_BOOK_SHARE = (STATIC_CP_BOOK / STATIC_CP_TOTAL) * 100; // ≈36.7%

  // ===== Handlers =====
  function updateTier(idx: number, key: "label" | "amount" | "pct", value: any) {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t)));
  }

  function addTier() {
    if (tiers.length >= 5) return;
    setTiers((prev) => [
      ...prev,
      { label: `Tier ${prev.length + 1}`, amount: 0, pct: 5 },
    ]);
  }

  function removeTier(idx: number) {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetAll() {
    setTiers([{ label: "Tier 1", amount: 250000, pct: 5 }]);
    setInputMode("byClients");
    setClients(20);
    setAvgWsePerClient(18);
    setTotalWseDirect(360);
    setAvgAnnualWage(55000);
    setMgmtFeePerWse(1200);
    setConversionRate(25);
    setCustomCommissionPct(15);
    setBookPortionPct(100);
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">ESI Channel Partner ROI Calculator</h1>
        <button
          onClick={resetAll}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          aria-label="Reset calculator"
        >
          Reset
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Current Annual Commission (Book)</div>
          <div className="text-2xl font-semibold">{currencyFmt.format(totalBookCommission)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Converted WSE to ESI</div>
          <div className="text-2xl font-semibold">{convertedWse.toLocaleString()}</div>
          <div className="text-xs text-gray-500">of {totalWse.toLocaleString()} total WSE</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Gross Management Fee (Annual)</div>
          <div className="text-2xl font-semibold">{currencyFmt.format(grossMgmtFee)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Current Book */}
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold mb-3">1) Current Book of Business</h2>
          <p className="text-sm text-gray-600 mb-4">Add up to five tiers to mirror your existing commission structure.</p>

          <div className="space-y-3">
            {tiers.map((t, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => updateTier(idx, "label", e.target.value)}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs text-gray-600 mb-1">Tier Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={t.amount}
                    onChange={(e) => updateTier(idx, "amount", numberFromInput(e.target.value))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
                <div className="col-span-10 sm:col-span-3">
                  <label className="block text-xs text-gray-600 mb-1">Commission %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={t.pct}
                    onChange={(e) => updateTier(idx, "pct", numberFromInput(e.target.value))}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  {tiers.length > 1 && (
                    <button
                      onClick={() => removeTier(idx)}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-red-50"
                      aria-label="Remove tier"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button
                onClick={addTier}
                disabled={tiers.length >= 5}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                + Add Tier
              </button>
              <div className="text-sm text-gray-500">
                Current Book Commission Total: <span className="font-semibold">{currencyFmt.format(totalBookCommission)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right column — ESI Opportunity */}
        <section className="rounded-2xl border p-5">
          <h2 className="text-lg font-semibold mb-3">2) ESI Opportunity (Management Fee)</h2>
          <p className="text-sm text-gray-600 mb-4">Estimate worksite employees (WSE) and commissions from ESI's management fee.</p>

          <div className="mb-3">
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={inputMode === "byClients"}
                  onChange={() => setInputMode("byClients")}
                />
                Estimate by clients × avg. WSE
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={inputMode === "byWSE"}
                  onChange={() => setInputMode("byWSE")}
                />
                Enter total WSE directly
              </label>
            </div>
          </div>

          {inputMode === "byClients" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1"># Clients</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={clients}
                  onChange={(e) => setClients(numberFromInput(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Avg. WSE per Client</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={avgWsePerClient}
                  onChange={(e) => setAvgWsePerClient(numberFromInput(e.target.value))}
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-1">Total WSE (direct)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={totalWseDirect}
                onChange={(e) => setTotalWseDirect(numberFromInput(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Avg. Annual Wage ($)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={avgAnnualWage}
                onChange={(e) => setAvgAnnualWage(numberFromInput(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                Total payroll: <span className="font-medium">{currencyFmt.format(totalPayroll)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mgmt Fee per WSE ($)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={mgmtFeePerWse}
                onChange={(e) => setMgmtFeePerWse(numberFromInput(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />
              <div className="text-xs text-gray-500 mt-1">
                Gross fee on converted WSE: <span className="font-medium">{currencyFmt.format(grossMgmtFee)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Conversion Rate %</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={conversionRate}
                  onChange={(e) => setConversionRate(numberFromInput(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm w-12 text-right">{Math.round(conversionRate)}%</span>
              </div>
            </div>
          </div>

          {/* Scenario: Static Standard CP Card */}
          <div className="rounded-2xl border p-4 mb-4">
            <h3 className="text-sm font-semibold mb-3">Standard CP (Static Example)</h3>
            <div className="grid grid-cols-5 gap-3 text-sm font-medium">
              <div className="text-gray-500">Scenario</div>
              <div className="text-gray-500 text-right">Mgmt Fee Commission</div>
              <div className="text-gray-500 text-right">+ Current Book</div>
              <div className="text-gray-500 text-right">Total Annual Revenue</div>
              <div className="text-gray-500 text-right">vs Current Book</div>

              <div className="flex items-center gap-2"><span>Standard CP</span></div>

              <div className="text-right">
                <div>{currencyFmt.format(STATIC_CP_MGMT)}</div>
                <div className="text-xs text-gray-500 mt-1">{pctFmt(STATIC_CP_MGMT_SHARE)} of total</div>
              </div>

              <div className="text-right">
                <div>{currencyFmt.format(STATIC_CP_BOOK)}</div>
                <div className="text-xs text-gray-500 mt-1">{pctFmt(STATIC_CP_BOOK_SHARE)} of total</div>
              </div>

              <div className="text-right">{currencyFmt.format(STATIC_CP_TOTAL)}</div>
              <div className="text-right">
                <div>{pctFmt(STATIC_CP_UPLIFT_PCT)}</div>
                <div className="text-xs text-gray-500 mt-1">{currencyFmt.format(STATIC_CP_UPLIFT_ABS)} added</div>
              </div>
            </div>
          </div>

          {/* Scenario: Custom Commission (Adjustable) */}
          <div className="rounded-2xl border p-4">
            <h3 className="text-sm font-semibold mb-3">Custom Commission (Adjustable)</h3>
            <div className="grid grid-cols-5 gap-3 text-sm font-medium">
              <div className="text-gray-500">Scenario</div>
              <div className="text-gray-500 text-right">Mgmt Fee Commission</div>
              <div className="text-gray-500 text-right">+ Current Book</div>
              <div className="text-gray-500 text-right">Total Annual Revenue</div>
              <div className="text-gray-500 text-right">vs Current Book</div>

              <div className="flex items-center gap-2"><span>Custom</span></div>

              {/* Mgmt Fee Commission with one control */}
              <div className="text-right">
                <div>{currencyFmt.format(customCommission)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Number.isNaN(customMgmtSharePct) ? "—" : `${pctFmt(customMgmtSharePct)} of total`}
                </div>
                <div className="mt-2 text-xs text-gray-600">Commission %</div>
                <div className="mt-1 flex items-center gap-2 justify-end">
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={0.5}
                    value={customCommissionPct}
                    onChange={(e) => setCustomCommissionPct(numberFromInput(e.target.value))}
                  />
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={customCommissionPct}
                    onChange={(e) => setCustomCommissionPct(numberFromInput(e.target.value))}
                    className="w-16 rounded-xl border px-2 py-1 text-right"
                  />
                  <span className="text-gray-500 text-xs">%</span>
                </div>
              </div>

              {/* Current Book with one control (portion of base) */}
              <div className="text-right">
                <div>{currencyFmt.format(adjustedBook)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {currencyFmt.format(totalBookCommission)} base • {Number.isNaN(customBookSharePct) ? "—" : `${pctFmt(customBookSharePct)} of total`}
                </div>
                <div className="mt-2 text-xs text-gray-600">Book % of base</div>
                <div className="mt-1 flex items-center gap-2 justify-end">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={bookPortionPct}
                    onChange={(e) => setBookPortionPct(numberFromInput(e.target.value))}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={bookPortionPct}
                    onChange={(e) => setBookPortionPct(numberFromInput(e.target.value))}
                    className="w-16 rounded-xl border px-2 py-1 text-right"
                  />
                  <span className="text-gray-500 text-xs">%</span>
                </div>
              </div>

              {/* Total + Uplift */}
              <div className="text-right">{currencyFmt.format(customTotalRevenue)}</div>
              <div className="text-right">
                <div>{Number.isNaN(customUpliftPct) ? "—" : pctFmt(customUpliftPct)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {Number.isNaN(customUpliftPct) ? "" : `${currencyFmt.format(customUpliftAbs)} added`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mt-3">
              <div></div>
              <div className="text-right">
                Per client (Custom added):
                <span className="font-medium text-gray-800"> {currencyFmt.format(perClientAddedRevCustom)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Narrative & CTA */}
      <section className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold mb-2">3) Talking Points</h2>
        <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
          <li>
            ESI management fee creates a <span className="font-medium">new revenue stream</span> on top of your current book — no need to replace existing commissions.
          </li>
          <li>
            At <span className="font-medium">{Math.round(conversionRate)}%</span> conversion, your adjustable custom scenario shows
            <span className="font-medium"> {currencyFmt.format(customCommission)}</span> at {customCommissionPct}% commission, for a total of
            <span className="font-medium"> {currencyFmt.format(customTotalRevenue)}</span> when combined with your selected book portion
            <span className="font-medium"> {currencyFmt.format(adjustedBook)}</span>.
          </li>
          <li>Illustrative only. Actual results depend on client mix, eligibility, and final agreements.</li>
        </ul>
      </section>

      <footer className="mt-6 text-xs text-gray-500">
        Disclaimer: This calculator is for illustration and prospecting only. It is not a quote or guarantee. All figures are annual and pre-tax.
      </footer>

      {/**
       * DEV / QA TEST CASES (manual):
       * 1) Default inputs:
       *    - Book tier: $250,000 @ 5% => Book = $12,500
       *    - Clients: 20, Avg WSE/Client: 18 => Total WSE = 360
       *    - Conversion: 25% => Converted WSE ~ 90
       *    - Mgmt fee/WSE: $1,200 => Gross Mgmt Fee = $108,000
       *    - STATIC Standard CP Card: Mgmt $21,600, Book $12,500, Total $34,100, Uplift $21,600 (172.8%)
       *    - Custom Commission %: 15% => Mgmt Fee Commission = $16,200
       *    - Book Portion: 100% => Adjusted Book = $12,500
       *    - Custom Total Revenue = $28,700; vs Current Book: +$16,200 (≈ 129.6%)
       * 2) Change Book Portion to 50% => Adjusted Book = $6,250; Custom Total = $22,450; vs Book = +$9,950 (≈ 79.6%)
       * 3) Change Custom Commission to 20% => Mgmt Fee Commission = $21,600 (others same), Total = $34,100; vs Book = +$21,600 (≈ 172.8%)
       * 4) Switch mode to "byWSE"; enter Total WSE 500, Conversion 10%; confirm calculations update coherently.
       * 5) Add up to 5 tiers and remove tiers; totals should reflect exactly.
       */}
    </div>
  );
}
