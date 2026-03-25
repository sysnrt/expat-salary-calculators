# Prompt: Netherlands Net Salary Calculator — Research + Implementation Spec

---

## TARGET TOOL
Cowork (Claude desktop agent with browser + file access)

---

## PROMPT (paste this in full)

---

You are a Dutch tax law researcher and senior frontend engineer. Your task has two sequential phases: **Phase 1 — Research & Document**, then **Phase 2 — Produce a coding specification** for a file called `netherlands.html`.

NEVER skip Phase 1. NEVER fabricate tax figures. If a source is uncertain or contradictory, flag it explicitly with `[VERIFY]`.

---

## PHASE 1 — RESEARCH (do this first, in full, before writing any code spec)

Search the web and cross-reference the following sources for the **current tax year (2025)**. You MUST consult at least these categories of sources:

**Required sources to check:**
1. **Belastingdienst (Dutch Tax Authority)** — https://www.belastingdienst.nl — official tax brackets, heffingskortingen, and loonheffing tables
2. **Rijksoverheid.nl** — official government announcements for 2025 salary/tax changes
3. **Nibud.nl** — national institute for family finance information, for net salary context
4. At least **one independent Dutch payroll/HR source** (e.g. Loonwijzer, Salariskompas, PayingIt, or similar) to cross-reference the official figures

**For each of the following items, record: the value, the source URL, and whether sources agree or conflict:**

### A. Income Tax Brackets (Box 1 — loonbelasting/inkomstenbelasting)
- All bracket thresholds (in €) and corresponding tax rates (%)
- Note: 2025 has a two-bracket system — confirm exact thresholds

### B. General Tax Credit (Algemene heffingskorting)
- Maximum amount (€)
- Income threshold at which it phases out
- Phase-out rate (%)
- Whether it reaches €0 and at what income level

### C. Labour Tax Credit (Arbeidskorting)
- Maximum amount (€) and the income level at which it peaks
- Build-up rate (%) and income range for build-up
- Phase-out rate (%) and income range for phase-out
- Whether it reaches €0 and at what income level

### D. AOW/Social Premiums (volksverzekeringen)
- AOW premium rate (%)
- ANW premium rate (%)
- WLZ premium rate (%)
- Combined premium rate and the income ceiling (maximumpremieloon)
- Note: these are only levied over the first bracket — confirm

### E. Employee Insurance Premiums (werknemersverzekeringen — if applicable for gross→net)
- WW (Werkherverzekering Werkloos) — both low and high rate (%)
- WIA/WAO (Arbeidsongeschiktheid) — rate (%)
- ZVW (Zvw-bijdrage werkgeversheffing) — employer contribution rate — note if excluded from employee-side calc
- Confirm which of these are employee-paid vs employer-paid

### F. Healthcare Contribution (Inkomensafhankelijke bijdrage Zvw)
- Employee-side rate (%) — nominale premie is NOT included, confirm
- Income ceiling (maximumbijdrageloon)

### G. Holiday Allowance (Vakantiegeld)
- Statutory minimum percentage (%)
- Whether the calculator should treat gross as including or excluding vakantiegeld

### H. Edge Cases to Document
- AOW-gerechtigde age (65+/67+): different premium rates apply — note the difference
- 30% ruling (expatregeling): note existence but mark as out of scope for v1
- Self-employed / freelance (ZZP): out of scope — note this

---

## PHASE 1 OUTPUT FORMAT

After completing research, output a structured document in this exact format:

```
# Netherlands Net Salary — Tax & Premium Reference (2025)
_Sources verified: [date of research]_

## Income Tax Brackets (Box 1)
| Bracket | From (€) | To (€) | Rate |
|---------|----------|--------|------|
| 1       | 0        | X      | X%   |
| 2       | X        | ∞      | X%   |
Source: [URL] | Cross-checked: [URL] | Status: ✅ Agreed / ⚠️ [VERIFY]

## General Tax Credit (Algemene heffingskorting)
- Maximum: €X
- Phase-out starts at: €X gross
- Phase-out rate: X%
- Reaches €0 at: €X gross
Source: [URL] | Cross-checked: [URL] | Status: ✅ / ⚠️ [VERIFY]

## Labour Tax Credit (Arbeidskorting)
- Build-up: X% on income from €X to €X → max €X
- Phase-out: X% on income from €X → reaches €0 at €X
Source: [URL] | Cross-checked: [URL] | Status: ✅ / ⚠️ [VERIFY]

## Social Premiums (Volksverzekeringen)
| Premium | Rate | Ceiling (€) |
|---------|------|-------------|
| AOW     | X%   | X           |
| ANW     | X%   | X           |
| WLZ     | X%   | X           |
| Combined| X%   | X           |
Source: [URL] | Cross-checked: [URL] | Status: ✅ / ⚠️ [VERIFY]

## Employee Insurance Premiums
| Premium | Rate | Who Pays | Ceiling (€) |
|---------|------|----------|-------------|
| WW (low)| X%   | Employer | X           |
| WW (high)| X%  | Employer | X           |
| WIA     | X%   | Employer | X           |
| Zvw (employer) | X% | Employer | X      |
Note: [state which are included in employee-side gross→net calculation]
Source: [URL] | Status: ✅ / ⚠️ [VERIFY]

## Healthcare Contribution (Zvw employee-side)
- Rate: X%
- Ceiling: €X
Source: [URL] | Status: ✅ / ⚠️ [VERIFY]

## Holiday Allowance
- Statutory minimum: X%
- Calculator assumption: [gross includes / excludes vakantiegeld]
Source: [URL] | Status: ✅ / ⚠️ [VERIFY]

## Conflicts / Items Requiring Verification
[List any figures where sources disagreed, with both values and both URLs]
```

---

## PHASE 2 — CODING SPECIFICATION

Only after Phase 1 is complete, output the following coding spec for `netherlands.html`. This spec will be handed directly to a coding agent — it MUST be precise, unambiguous, and self-contained.

```
# Coding Spec: netherlands.html — Dutch Net Salary Calculator

## File
- Filename: netherlands.html
- Output location: same directory as template.html

## Existing Shared Files — READ BEFORE WRITING ANY CODE
The project has four existing files the coding agent MUST read in full before writing netherlands.html:

| File         | Purpose                                                    | Action                          |
|--------------|------------------------------------------------------------|---------------------------------|
| template.html| Base HTML structure, head tags, meta, container layout     | Copy as starting point          |
| shared.css   | Global styles, color palette, typography, spacing system   | Link as-is — do NOT duplicate   |
| shared.js    | Utility functions, formatters, shared state or helpers     | Link as-is — do NOT re-implement|
| nav.js       | Navigation component initialization and routing logic      | Link as-is — do NOT modify      |

## File Structure Rules
- START from template.html — copy it and rename to netherlands.html
- Link shared.css in <head> EXACTLY as template.html does — do not inline shared styles
- Link shared.js and nav.js EXACTLY as template.html does — do not copy their contents inline
- Any styles unique to the calculator go in a <style> block inside netherlands.html — AFTER the shared.css link
- Any JS unique to the calculator goes in a <script> block at the bottom of netherlands.html — AFTER the shared.js and nav.js links
- NEVER duplicate or override anything already defined in shared.css or shared.js — inspect those files first and reuse what exists
- STOP and ask if template.html, shared.css, shared.js, or nav.js cannot be found or read

## Inputs (UI controls the user adjusts)
1. Gross annual salary (€) — number input, default €50,000
2. Pay period — toggle: Monthly / Annual (affects display only, calculation always uses annual)
3. Age — toggle or checkbox: "Under AOW age" / "AOW age or older" (affects social premium rates)
4. Holiday allowance — checkbox: "Holiday allowance (8%) included in gross" — default: NOT included

## Calculation Logic (implement EXACTLY using values from Phase 1)

### Step 1 — Normalize to annual gross
- If vakantiegeld not included: annual_gross_with_vakantiegeld = gross × 1.08
- If vakantiegeld included: annual_gross_with_vakantiegeld = gross

### Step 2 — Social premiums (Volksverzekeringen)
- taxable_base_premiums = min(annual_gross_with_vakantiegeld, [ceiling from Phase 1])
- total_premium = taxable_base_premiums × [combined rate from Phase 1]
- If AOW age: use reduced rate (AOW premium does NOT apply) — use [rate from Phase 1]

### Step 3 — Income tax (Box 1 loonbelasting)
- Apply brackets from Phase 1 progressively to annual_gross_with_vakantiegeld
- bracket_1_tax = min(gross, [bracket 1 ceiling]) × [bracket 1 rate]
- bracket_2_tax = max(0, gross − [bracket 1 ceiling]) × [bracket 2 rate]
- total_income_tax_before_credits = bracket_1_tax + bracket_2_tax

### Step 4 — Algemene heffingskorting
- If gross ≤ [phase-out start]: credit = [maximum]
- If gross > [phase-out start] AND < [zero point]: credit = [maximum] − ([phase-out rate] × (gross − [phase-out start]))
- If gross ≥ [zero point]: credit = 0

### Step 5 — Arbeidskorting
- Build-up phase: credit = min(gross, [peak income]) × [build-up rate], capped at [maximum]
- Phase-out phase: if gross > [phase-out start]: reduce by (gross − [phase-out start]) × [phase-out rate]
- Floor at 0

### Step 6 — Net income tax
- net_income_tax = max(0, total_income_tax_before_credits − algemene_heffingskorting − arbeidskorting)

### Step 7 — Zvw employee contribution
- zvw_base = min(annual_gross_with_vakantiegeld, [Zvw ceiling from Phase 1])
- zvw = zvw_base × [Zvw rate from Phase 1]

### Step 8 — Net annual salary
- net_annual = annual_gross_with_vakantiegeld − total_premium − net_income_tax − zvw

### Step 9 — Display
- Net monthly = net_annual / 12
- Effective tax rate = (annual_gross_with_vakantiegeld − net_annual) / annual_gross_with_vakantiegeld × 100

## Outputs (display all of these in the results panel)
| Label                        | Value         |
|------------------------------|---------------|
| Gross annual                 | €X,XXX        |
| Gross monthly                | €X,XXX        |
| Social premiums (annual)     | €X,XXX        |
| Income tax (before credits)  | €X,XXX        |
| Algemene heffingskorting     | −€X,XXX       |
| Arbeidskorting               | −€X,XXX       |
| Net income tax               | €X,XXX        |
| Zvw contribution             | €X,XXX        |
| **Net annual**               | **€X,XXX**    |
| **Net monthly**              | **€X,XXX**    |
| Effective tax rate           | XX.X%         |

## UI Requirements
- Inherit layout, color, and typography from shared.css — do not redefine what already exists
- Use the same page container, card, and heading patterns as template.html
- All results update live as inputs change (no submit button needed)
- Mobile-responsive — use whatever breakpoint/grid system shared.css already defines
- Currency formatted with Dutch locale (€1.234,56 format — use toLocaleString('nl-NL'))
- Check shared.js first: if a currency or number formatter already exists there, USE IT — do not write a duplicate
- Add a small footnote: "Calculation based on 2025 tax rules. Excludes 30% ruling, ZZP, and employer premiums. For guidance only."
- Add a "Sources" collapsible section at the bottom listing all URLs from Phase 1
- Navigation must be initialized via nav.js exactly as template.html does — do not build a custom nav

## Hardcoded Constants Block
At the top of the calculator <script> block, define ALL tax figures as named constants:
const TAX_BRACKET_1_CEILING = X;
const TAX_BRACKET_1_RATE = X;
const TAX_BRACKET_2_RATE = X;
// ... etc for every figure from Phase 1
// This makes future tax year updates trivial — change constants only, touch no logic

## STOP CONDITIONS for coding agent
- STOP and read shared files before writing a single line of netherlands.html
- STOP and ask if template.html, shared.css, shared.js, or nav.js cannot be found
- STOP and ask if any Phase 1 value is marked [VERIFY] and was not resolved
- STOP and ask before adding any tax figure not documented in Phase 1
- Do NOT add 30% ruling, ZZP, or employer premium logic in v1
- Do NOT load external JS libraries or CSS frameworks not already present in template.html
```

---

## FINAL CHECKPOINT

After both phases are complete, output:
✅ Phase 1 complete — [N] sources verified, [N] items flagged [VERIFY]
✅ Phase 2 complete — coding spec ready for implementation
⚠️ Items requiring human review before coding: [list or "none"]
