// Teacher's activity sheet. In production it comes from the activity editor
// and lives in Postgres + a vector store. Here we define both the step-by-
// step structure the student clicks through and a rich set of text chunks
// the AI retrieves against.
//
// Procedure adapted from the LibreTexts / Chem 10 canonical "Titration of
// Vinegar" experiment (5.00 mL vinegar + ~20 mL DI water + 5 drops
// phenolphthalein, titrated with ~0.100 M NaOH; keep the two palest
// endpoints).

export type StepInputKind = "text" | "number" | "choice" | "photo";

export type ActivityStep = {
  id: string;
  title: string;
  instructions: string;
  inputKind: StepInputKind;
  choices?: string[];
  unit?: string;
  expected?: string;
  hintsPolicy: string;
  // Optional "Learn" block shown before the goal — teaches any new concept
  // or terminology this step depends on. Markdown-lite: paragraphs
  // separated by blank lines; **bold** and _italic_ inline.
  concept?: string;
};

export type Activity = {
  id: string;
  title: string;
  subject: string;
  gradeBand: string;
  learningGoal: string;
  materials: string[];
  safety: string[];
  steps: ActivityStep[];
  commonMisconceptions: { id: string; label: string; description: string }[];
  chunks: { id: string; text: string }[];
};

export const activity: Activity = {
  id: "act_vinegar_titration_v2",
  title:
    "Titration of Vinegar with 0.100 M NaOH: Determining Molarity and % Acetic Acid",
  subject: "General Chemistry I — Quantitative Analysis Lab",
  gradeBand: "First-year undergraduate",
  learningGoal:
    "Students titrate commercial vinegar with standardized 0.100 M NaOH using phenolphthalein as an indicator, determine the molarity and mass-percent of acetic acid, and evaluate the precision of three trials by keeping the two palest endpoints.",
  materials: [
    "50.00 mL Class-A burette (± 0.05 mL) with stopcock, on a burette stand + clamp",
    "5.00 mL volumetric pipette + pipette bulb",
    "250 mL Erlenmeyer flask × 3 (one per trial)",
    "50 mL beaker (intermediate — never pipette from stock bottles)",
    "Small funnel (for filling the burette)",
    "White tile or sheet of white paper (background for endpoint)",
    "Wash bottle with deionized water",
    "Waste beaker (~150 mL) to catch burette drainage during rinsing",
    "Commercial white vinegar (labelled ~5 % acetic acid) — treated as the unknown",
    "Standardized ~0.100 M NaOH (exact molarity written on the stock bottle)",
    "Phenolphthalein indicator (1 % ethanolic solution) in dropper bottle",
    "Splash goggles, nitrile gloves, lab coat",
  ],
  safety: [
    "Splash goggles ALL the time — 0.1 M NaOH causes eye damage.",
    "Nitrile gloves. If NaOH touches skin, rinse 15 minutes.",
    "Never mouth-pipette. Always use a bulb.",
    "Do not carry a filled burette across the room — set up the stand where you'll titrate, then fill.",
    "Neutralize acid/base spills with sodium bicarbonate before wiping.",
    "At the end of the lab: neutralized flask contents go into the aqueous waste jug, NOT the sink.",
  ],
  steps: [
    // ---------- Phase 1: pre-lab ----------
    {
      id: "s01",
      title: "Safety scenario",
      concept:
        "**Why safety comes first.** Titration involves a strong base (0.100 M NaOH) and glass under stress. NaOH causes eye damage on contact — the standard control is splash goggles worn continuously, not just when pouring. Pipetting always uses a bulb (mouth-pipetting is banned in every teaching lab). Spills are neutralized with sodium bicarbonate to bring the pH near 7 before wiping.",
      instructions:
        "You're at the bench and you spill about 5 mL of the 0.100 M NaOH titrant on the countertop. What is the correct FIRST action?",
      inputKind: "choice",
      choices: [
        "Wipe it up immediately with paper towel — dilution isn't important for such a small spill.",
        "Cover the spill with solid sodium bicarbonate, wait for effervescence to stop, then wipe.",
        "Rinse the spill with water first, then wipe it up.",
        "Ignore it; the NaOH is dilute enough to evaporate safely.",
      ],
      expected:
        "Option 2. Neutralize with bicarbonate before wiping so you're not smearing a caustic film across the bench (and potentially onto skin later).",
      hintsPolicy:
        "If they pick 'wipe immediately', ask what's on the paper towel afterwards and whether their hand touches it. If they pick 'rinse with water', ask what happens to the total volume of caustic liquid on the bench — do they now have less NaOH or just more diluted NaOH spread wider.",
    },
    {
      id: "s02",
      title: "State the goal of this titration in your own words",
      concept:
        "**Titration in one paragraph.** A titration slowly adds a solution of _known_ concentration (the **titrant** — here, 0.100 M NaOH) to a solution of _unknown_ concentration (the **analyte** — here, vinegar) until they've reacted completely. A colour-changing **indicator** signals the moment of completion. From the volume of titrant used and its known concentration, you can back-calculate how much of the unknown was present.\n\n**What we're determining today.** The **molarity** of acetic acid in vinegar (mol/L) and its **mass-percent** (grams of acetic acid per 100 g of vinegar). Commercial vinegar is labelled ~5 % w/w — our answer should land near that.",
      instructions:
        "Before you touch any glassware, write 1–2 sentences: what number are you determining, and what does the faint-pink endpoint of phenolphthalein tell you?",
      inputKind: "text",
      expected:
        "Should mention determining the concentration (molarity) and/or mass-percent of acetic acid in vinegar; the faint pink endpoint marks the point at which the moles of NaOH added equal the moles of acetic acid originally in the flask.",
      hintsPolicy:
        "Do NOT write the answer. If they only say 'find the acid', ask what specific number. If they don't mention the indicator, ask what phenolphthalein's job is here.",
    },

    // ---------- Phase 2: burette prep ----------
    {
      id: "s03",
      title: "Predict a rinsing mistake",
      concept:
        "**What a burette is.** A burette is a long graduated glass tube with a **stopcock** (valve) at the bottom, mounted vertically on a stand. You read the liquid level before and after delivery; the difference is the _volume delivered_. A Class-A 50 mL burette is precise to ± 0.05 mL, with 0.1 mL graduations — you estimate the last digit between marks.\n\n**Why rinsing matters.** Even after washing with DI water, a thin film of water clings to the glass walls. If you fill the burette with 0.100 M NaOH on top of that film, the titrant near the stopcock is slightly diluted. Every reading you take is _systematically high_ because you needed extra volume of the now-weaker titrant to reach the endpoint. The fix is to rinse three times with a small amount of the titrant itself before filling.",
      instructions:
        "Your lab partner cleaned the burette and, in a hurry, filled it with 0.100 M NaOH directly — no titrant rinse. You both run the titration. Compared to the true value, what do you expect for the reported % acetic acid?",
      inputKind: "choice",
      choices: [
        "Higher than the true value.",
        "Lower than the true value.",
        "Unchanged — a tiny water film is negligible.",
        "Unpredictable — could go either way.",
      ],
      expected:
        "Higher. The film of water dilutes the NaOH near the stopcock, so more volume is needed to reach the endpoint. More volume × 0.100 M gives more moles of NaOH (on paper), which back-solves to more moles of acetic acid than really are present.",
      hintsPolicy:
        "If they pick 'lower', ask whether the observed volume delivered will be more or less than it would have been with pure titrant. If they pick 'unchanged', ask about a real film of water, not the ideal case. Do NOT reveal the answer.",
    },
    {
      id: "s04",
      title: "Fill the burette and take a photo of the initial meniscus",
      concept:
        "**The meniscus.** When you look at water (or dilute NaOH) in a narrow glass column, the surface isn't flat — it curves _downward_ in the middle, forming a bowl shape called a **concave meniscus**. Convention: read the **bottom** of the curve. Get your eye at the level of the meniscus; reading from above or below produces a **parallax error** of ~0.1 mL.\n\n**Air bubble check.** After filling, look at the tip below the stopcock. Any trapped air bubble will collapse partway through the titration and appear on your reading as extra volume delivered. Open the stopcock briefly to shoot the bubble out before you record the initial reading.",
      instructions:
        "Using a funnel, fill the burette above the 0.00 mL mark. Drain briefly through the stopcock into the waste beaker to expel any air bubble in the tip and to bring the level clearly below the 0.00 mL line. Take a straight-on eye-level photo of the meniscus against a white background — the AI will comment on your reading technique.",
      inputKind: "photo",
      expected:
        "Photo at eye level; bottom of meniscus resting on a graduation; no air bubble in the tip; white background behind the burette.",
      hintsPolicy:
        "If the student says they can't see the meniscus, ask about the white paper behind and about lighting. If the reading appears above the meniscus in the photo (parallax), describe what an eye-level shot would look like without naming the answer.",
    },
    {
      id: "s05",
      title: "Record the initial burette reading",
      concept:
        "**Significant figures on a burette.** A 50 mL Class-A burette has graduations every 0.1 mL. The manufacturer's tolerance is ± 0.05 mL. Convention: report two decimal places (e.g. 0.42 mL), where the last digit is your best _estimate_ between the marked lines. Writing 0.4 or 0.5 throws away information the instrument can actually give you.",
      instructions:
        "Read the bottom of the meniscus to the nearest 0.01 mL. Typical initial values are between 0.00 and 5.00 mL. Enter it below.",
      inputKind: "number",
      unit: "mL",
      expected:
        "Any value 0.00–5.00 mL. Precision matters — Class-A 50 mL burette allows two decimal places, the last estimated between marks.",
      hintsPolicy:
        "If they enter one decimal (e.g. '0.5'), ask what the smallest graduation is on a 50 mL burette (0.1 mL) and how many digits a Class-A burette allows.",
    },

    // ---------- Phase 3: analyte ----------
    {
      id: "s06",
      title: "Prepare the analyte and confirm the colour",
      concept:
        "**Volumetric pipette technique.** A 'TD' (_to deliver_) volumetric pipette is calibrated so that the correct volume comes out under gravity, with the last drop touched off against the glass. Do **not** blow out the small residual droplet — it's accounted for in the calibration; blowing adds ~0.02–0.03 mL of extra vinegar. Never pipette from the stock bottle; pour a working aliquot into a clean beaker first so contamination doesn't return upstream.\n\n**Phenolphthalein.** A pH indicator that is **colourless** below pH ~8.2 and **pink** above ~10, transitioning through faint pink in between. Vinegar is acidic (pH ~2.4), so the flask must be colourless before you start titrating.\n\n**Why dilute with 20 mL of water?** It raises the total liquid volume so you can swirl without splashing, and it makes the faint-pink endpoint easier to see. Water doesn't change the _number of moles_ of acetic acid you started with.",
      instructions:
        "You've done the preparation: 5.00 mL vinegar pipetted, ~20 mL DI water added, 5 drops of phenolphthalein — and you see FAINT PINK before adding any titrant. What is the most likely explanation?",
      inputKind: "choice",
      choices: [
        "The vinegar has gone off; it's now basic.",
        "The DI water was contaminated with base (e.g. cleaning residue on the flask).",
        "You added phenolphthalein by mistake instead of a different indicator.",
        "This is normal — phenolphthalein always shows faint pink in vinegar.",
      ],
      expected:
        "Option 2. Vinegar is strongly acidic (pH ~2.4) so phenolphthalein should be colourless; a faint pink means something basic is already in the flask — most commonly cleaning residue not fully rinsed from the glassware. Fix: re-rinse the flask with DI water and start over.",
      hintsPolicy:
        "If they pick option 1, ask what a pH change would need — is a small amount of contamination more or less plausible than the vinegar itself changing? If option 4, ask what pH range phenolphthalein transitions in and whether vinegar sits in that range.",
    },

    // ---------- Phase 4: Trial 1 ----------
    {
      id: "s07",
      title: "Trial 1 — describe your titration technique",
      concept:
        "**Equivalence point vs endpoint.** The **equivalence point** is the exact moment where moles of NaOH added = moles of acetic acid originally present. It's a chemistry concept — invisible directly. The **endpoint** is what your eye actually observes: the moment the indicator changes colour and stays. A well-matched indicator makes the two nearly coincide; phenolphthalein's transition (~pH 8.2–10) sits close to the true equivalence pH for a weak acid + strong base (~8.7 here), so they agree within about one drop.\n\n**Why one drop can flip the flask.** Very near equivalence, almost all the acid has been consumed, so there's no acid left to 'buffer' the added NaOH. A single drop shifts the pH dramatically. That's why you slow to drop-wise as the pink flashes start persisting.\n\n**Swirling.** The stopcock drips titrant onto one spot. Without swirling, that spot briefly becomes basic (pink) and then re-mixes to acid (colourless). Continuous swirling keeps the flask uniform so the endpoint is a whole-flask event, not a local flash.",
      instructions:
        "Titrate the flask with 0.100 M NaOH until the entire solution turns FAINT pink and stays pink for at least 30 seconds while swirling. In 2–3 sentences, describe your technique — swirling, rate of addition, when you slowed down. You can dictate with the mic.",
      inputKind: "text",
      expected:
        "Should mention continuous swirling with the non-dominant hand while controlling the stopcock; initial rapid addition (~2–3 mL/s) far from endpoint; slowing to drop-wise as the pink flashes start persisting; final drop-by-drop or half-drop rinsed off the tip.",
      hintsPolicy:
        "If the student says they didn't swirl, ask what happens locally at the drop point without swirling. If they say they went fast the whole time, ask what happens the moment past the equivalence point.",
    },
    {
      id: "s08",
      title: "Trial 1 — photo of your endpoint",
      concept:
        "**What 'faint pink' actually means.** Compare to a strawberry milkshake heavily diluted with milk. Deep magenta means you overshot by several drops — the reported acetic acid content will be biased high. No pink at all after 30 seconds means the indicator faded and you're still short — add one more drop.",
      instructions:
        "Take a photo of the flask from directly above with the white tile underneath. The AI will comment on whether the colour looks like a good endpoint.",
      inputKind: "photo",
      expected:
        "A very pale pink — like a strawberry milkshake heavily diluted with milk. Not colourless (undershoot); not deep magenta (overshoot).",
      hintsPolicy:
        "If the photo looks clear (no pink at all), ask whether the pink lasted the full 30 seconds without fading — if it faded, more titrant is needed. If it looks deep pink, gently note the trial was likely overshot and suggest keeping it as a data point but flagging it.",
    },
    {
      id: "s09",
      title: "Trial 1 — record the final burette reading",
      instructions:
        "Read the bottom of the meniscus to the nearest 0.01 mL. Enter the FINAL volume (not the delivered volume).",
      inputKind: "number",
      unit: "mL",
      expected:
        "For ~5 % vinegar with 0.100 M NaOH and 5.00 mL sample, the volume delivered is around 41.6 mL. If the initial reading was ~0.30 mL, the final reading will be around ~41.9 mL.",
      hintsPolicy:
        "If the final reading is smaller than the initial, ask which end of a burette is 0 mL — burettes are read top-down (0 at top, 50 at bottom).",
    },

    // ---------- Phase 5: Trials 2 & 3 ----------
    {
      id: "s10",
      title: "Trial 2 — volume of NaOH used",
      instructions:
        "Refill the burette (rinse any drained titrant back into the waste beaker first). Pipette a fresh 5.00 mL of vinegar into a new Erlenmeyer, add ~20 mL DI water and 5 drops phenolphthalein, and titrate again. Enter the VOLUME OF NAOH USED for Trial 2 (final − initial), to 0.01 mL.",
      inputKind: "number",
      unit: "mL",
      expected:
        "Should agree with Trial 1 within ~0.20 mL if technique is consistent (~41.6 mL for typical 5 % vinegar). Second trials are often better than first because the student has calibrated their sense of the endpoint.",
      hintsPolicy:
        "If Trial 2 differs from Trial 1 by more than 0.5 mL, ask what changed — did they stop earlier or later, was there an air bubble on refill?",
    },
    {
      id: "s11",
      title: "Trial 3 — volume of NaOH used",
      instructions:
        "One more trial. Enter the volume of NaOH used, to 0.01 mL.",
      inputKind: "number",
      unit: "mL",
      expected:
        "Ideally the three trials agree within ± 0.20 mL. The lab expects the student to keep the TWO PALEST endpoints and drop the darkest.",
      hintsPolicy:
        "If Trial 3 disagrees with the other two, ask which trial had the palest endpoint colour — that's the one most likely to be closest to the true equivalence point.",
    },
    {
      id: "s12",
      title: "Which two trials will you keep?",
      concept:
        "**Precision vs accuracy.** _Precision_ = your trials agree with each other. _Accuracy_ = your trials agree with the true value. High precision without high accuracy is possible (all three trials wrong by the same amount, e.g. from a systematic rinsing error).\n\n**Why keep the two _palest_ endpoints.** The palest endpoint is the one closest to just-past equivalence. A darker endpoint means more titrant was added after the true equivalence point, biasing the result high. Selecting by endpoint colour is a defensible way to drop a suspect trial without cherry-picking numerical agreement.",
      instructions:
        "This lab's convention: keep the TWO trials with the palest endpoints (i.e. the ones you're most confident weren't overshot). Which two trials are you keeping, and why?",
      inputKind: "text",
      expected:
        "Names the two trials with the palest observed pink and gives a one-sentence justification (colour comparison, agreement between the two, or endpoint held for the full 30 s).",
      hintsPolicy:
        "If the student picks based purely on which numbers are closest to each other, ask about the endpoint COLOUR they observed for each — pale is closer to equivalence than dark.",
    },

    // ---------- Phase 6: analysis ----------
    {
      id: "s13",
      title: "Average volume of NaOH used",
      instructions:
        "Compute the mean of the two trials you're keeping. Enter the mean volume in mL, to 0.01 mL.",
      inputKind: "number",
      unit: "mL",
      expected:
        "About 41.6 mL for typical 5 % vinegar with 0.100 M NaOH.",
      hintsPolicy:
        "If they average all three including a clear outlier, ask whether every trial is equally trustworthy given the endpoint colours they described.",
    },
    {
      id: "s14",
      title: "Moles of NaOH delivered",
      concept:
        "**Molarity.** Written M, unit mol/L. A 0.100 M solution has 0.100 mole of solute in every 1.00 litre of solution.\n\n**Getting moles from a volume.** moles = M × V(L). The volume must be in _litres_ — a common slip is to multiply by mL and get a number 1000× too big. Convert first: 41.6 mL = 0.0416 L.",
      instructions:
        "Using your average volume and the stock concentration 0.100 M NaOH, compute the moles of NaOH. Report in moles, 3 significant figures.",
      inputKind: "number",
      unit: "mol",
      expected:
        "About 4.16 × 10⁻³ mol (= 0.100 mol/L × 0.04160 L).",
      hintsPolicy:
        "Do NOT compute for them. If they enter 4.16, ask about units (moles vs millimoles). If they multiplied by mL instead of L, ask about unit conversion.",
    },
    {
      id: "s15",
      title: "Moles of acetic acid in the sample",
      concept:
        "**Stoichiometry from a balanced equation.** The coefficients in a balanced chemical equation tell you the mole ratio in which species react. For\n\n    CH3COOH + NaOH → CH3COONa + H2O\n\nthe coefficients are 1 : 1, so one mole of NaOH reacts with exactly one mole of acetic acid. Moles of acetic acid consumed = moles of NaOH added at equivalence.\n\n(This is _not_ true for every acid-base reaction. Sulfuric acid, H2SO4, needs two moles of NaOH per mole of acid because it can donate two protons — the ratio is 1 acid : 2 base. Always look at the balanced equation.)",
      instructions:
        "Write the balanced neutralization on paper: CH₃COOH + NaOH → CH₃COONa + H₂O. What's the mole ratio of acetic acid to NaOH? Enter the moles of acetic acid that were in your 5.00 mL vinegar sample.",
      inputKind: "number",
      unit: "mol",
      expected:
        "Same as moles NaOH: ~4.16 × 10⁻³ mol (1:1 stoichiometry).",
      hintsPolicy:
        "If they multiply/divide by 2, ask them to count the moles of NaOH per mole of acetic acid in their balanced equation.",
    },
    {
      id: "s16",
      title: "Molarity of acetic acid in the original vinegar",
      concept:
        "**Dilution doesn't create or destroy moles.** When you added 20 mL of water to the flask, the total volume grew from 5.00 mL to ~25 mL — but every acetic acid molecule you started with is still there. The moles of acid didn't change; only the concentration (moles per litre) went down.\n\nSo to compute the concentration of acetic acid in the **original vinegar**, divide the moles you found by **5.00 mL** (the volume of pure vinegar you pipetted), not by 25 mL. If you divide by 25 mL you'll get the diluted concentration inside the flask, which isn't what a consumer buys from the shelf.",
      instructions:
        "Convert moles of acetic acid to molarity in the original vinegar (before you added the 20 mL of water — the water dilutes the total volume but not the moles). Report in mol/L, 3 sig figs.",
      inputKind: "number",
      unit: "mol/L",
      expected:
        "About 0.833 M (= 4.16 × 10⁻³ mol ÷ 0.00500 L). Range 0.5–1.0 M is normal for household vinegar.",
      hintsPolicy:
        "If they divide by the total volume in the flask (5 mL + 20 mL) instead of the 5.00 mL of vinegar, ask which volume held the acetic acid before the water was added.",
    },
    {
      id: "s17",
      title: "% acetic acid by mass",
      concept:
        "**Mass percent (% w/w).** How many grams of _solute_ per 100 g of _solution_, expressed as a percentage:\n\n    % w/w = (mass of solute / mass of solution) × 100\n\nNote this is different from molarity (mol / L). A vinegar can be reported as _0.833 M_ acetic acid (chemistry) or as _5 % w/w_ acetic acid (grocery-store label). Both are valid descriptions of the same solution; the conversion goes through the density.\n\n**Density.** Density = mass / volume. For this lab we _assume_ vinegar density = 1.00 g/mL. The true value is closer to 1.005 g/mL, so we're accepting a ~0.5 % systematic shift — fine for a two-sig-fig answer.",
      instructions:
        "Assume the density of vinegar is 1.00 g/mL. Compute mass % = (mass acetic acid ÷ mass vinegar) × 100 %. Molar mass of acetic acid is 60.05 g/mol. Round to 2 significant figures.",
      inputKind: "number",
      unit: "%",
      expected:
        "About 5.0 % — commercial white vinegar is labelled 5 % w/w. Range 4–8 % is normal.",
      hintsPolicy:
        "If they report the molarity in % (e.g. '0.83 %'), ask the difference between M (mol/L) and % by mass. If off by 1000×, ask about g vs mg.",
    },

    // ---------- Phase 7: reflect ----------
    {
      id: "s18",
      title: "Precision and error analysis",
      concept:
        "**Error propagation, the intuition.** When several measured numbers combine multiplicatively into a final result, the _relative_ (percentage) uncertainties add in quadrature (square-root-of-sum-of-squares). In practice, one term is usually much larger than the others and dominates the total.\n\n**Relative uncertainty of one measurement** is simply the instrument's uncertainty divided by the measured value, expressed as a percentage. For example, a burette read as 20.00 ± 0.05 mL has a relative uncertainty of 0.05 / 20.00 ≈ 0.25 %.\n\nYour four measured quantities are: the initial burette reading, the final burette reading, the volume of the volumetric pipette, and the assumed density of vinegar. Each has a manufacturer or convention tolerance. Compute the relative uncertainty of each _for your own numbers_ and see which one dominates.",
      instructions:
        "In 3–4 sentences: which of your four measured quantities (initial burette reading, final burette reading, pipette volume, or the density assumption) contributes the LARGEST relative error to your % acetic acid result? Show the ratio you computed — e.g. '0.05 mL / 41.5 mL ≈ 0.12 %'.",
      inputKind: "text",
      expected:
        "A defensible answer usually says: the burette-reading terms are ± 0.05 mL each on ~0.3 mL initial and ~41.6 mL final — the initial reading dominates the burette pair because 0.05 / 0.3 is ~17 %. Or the density assumption (1.00 vs true 1.005 g/mL) contributes a ~0.5 % systematic shift. The pipette 5.00 ± 0.02 mL is ~0.4 %. What matters is that the student shows a NUMBER, not that they pick a canonical winner.",
      hintsPolicy:
        "If they say 'human error', ask which specific reading and what the tolerance divided by the value comes out to. If they only cite the final burette reading, ask what a ± 0.05 mL uncertainty means on the small initial reading versus on the large final reading — same absolute number, very different relative fractions. Do not compute for them.",
    },
  ],
  commonMisconceptions: [
    {
      id: "m_endpoint_dark",
      label: "Dark pink means endpoint",
      description:
        "Student titrates until the flask is clearly pink or magenta. Endpoint is the faintest pink that persists ~30 s — dark pink means the equivalence point was passed and the % acetic acid comes out high.",
    },
    {
      id: "m_rinse_water",
      label: "Rinsing burette with water is enough",
      description:
        "Student rinses the burette with water only. Residual water dilutes the titrant, giving a systematically higher volume and a higher apparent acid content.",
    },
    {
      id: "m_no_swirl",
      label: "Titrating without swirling",
      description:
        "Student doesn't swirl the flask, so a local pink patch appears at the point of contact and vanishes. Endpoint is misjudged.",
    },
    {
      id: "m_pipette_blow",
      label: "Blowing out the volumetric pipette",
      description:
        "Student blows the last drop out of a TD volumetric pipette. TD pipettes are calibrated to deliver without blow-out; blowing delivers ~0.02–0.03 mL extra.",
    },
    {
      id: "m_M_vs_percent",
      label: "Molarity vs mass percent",
      description:
        "Student reports the molarity of acetic acid as the '% acetic acid'. These are different quantities: M is mol/L; % is mass/mass × 100.",
    },
    {
      id: "m_stoich",
      label: "Wrong stoichiometry",
      description:
        "Student multiplies or divides by 2 'because it's acid + base'. The balanced equation gives a 1:1 ratio for acetic acid + NaOH.",
    },
    {
      id: "m_air_bubble",
      label: "Ignoring the air bubble in the tip",
      description:
        "Student starts titrating with an air bubble in the burette tip. The bubble collapses partway through and adds phantom volume to the reading.",
    },
    {
      id: "m_reading_top",
      label: "Reading the top of the meniscus",
      description:
        "Student reads the top edge of the liquid, not the bottom of the concave meniscus. Systematic offset ~0.1 mL.",
    },
    {
      id: "m_parallax",
      label: "Parallax when reading the burette",
      description:
        "Student reads from above or below eye level. Introduces ± 0.1 mL error per reading.",
    },
    {
      id: "m_indicator_dose",
      label: "Too much indicator",
      description:
        "Student adds many drops of phenolphthalein 'to see it better'. Extra indicator is itself weakly acidic and shifts the apparent endpoint.",
    },
    {
      id: "m_average_all",
      label: "Averaging with an obvious outlier",
      description:
        "Student includes a clearly overshot trial in their mean without justification. The lab convention is to keep the two palest endpoints.",
    },
    {
      id: "m_total_volume",
      label: "Dividing by total flask volume for molarity",
      description:
        "Student divides moles of acetic acid by 25 mL (5 mL vinegar + 20 mL water) instead of the 5.00 mL of vinegar. Water only dilutes; it doesn't change the moles of acid originally present.",
    },
  ],
  chunks: [
    {
      id: "c01",
      text: "Learning goal: determine the molarity and mass-percent of acetic acid in commercial vinegar by titration with standardized 0.100 M NaOH using phenolphthalein as the endpoint indicator; evaluate precision across three trials by keeping the two palest endpoints.",
    },
    {
      id: "c02",
      text: "Balanced reaction: CH3COOH(aq) + NaOH(aq) -> CH3COONa(aq) + H2O(l). Mole ratio is 1:1. Moles of acetic acid in the flask equal moles of NaOH delivered at the equivalence point.",
    },
    {
      id: "c03",
      text: "Phenolphthalein is colourless below pH ~8.2 and pink above pH ~10, transitioning through faint pink around pH 8.2–8.4. Because acetic acid is weak and its conjugate base is basic, the equivalence pH in this titration is around 8.7 — inside the phenolphthalein transition, so the indicator is a good match.",
    },
    {
      id: "c04",
      text: "Correct endpoint: the FAINTEST pink that persists for at least 30 seconds while swirling. A clearly pink or magenta flask means the equivalence point was passed and the reported acetic acid content will be too high.",
    },
    {
      id: "c05",
      text: "Standardized 0.100 M NaOH: 'standardized' means the concentration was verified by previous titration against a primary standard (typically KHP). Solid NaOH is hygroscopic and absorbs CO2, so freshly weighed NaOH cannot be trusted to three sig figs.",
    },
    {
      id: "c06",
      text: "Burette rinsing rule: after cleaning, the burette walls carry a film of DI water. Rinse three times with small ~5 mL aliquots of the NaOH titrant and drain each rinse through the stopcock — this replaces the water film with titrant so the concentration inside the burette is truly 0.100 M.",
    },
    {
      id: "c07",
      text: "Volumetric pipette technique: a TD ('to deliver') 5.00 mL pipette is calibrated to release its stated volume by gravity with the last drop touched off against the flask wall. Do NOT blow out the remaining droplet — TD pipettes account for it. Blowing adds ~0.02–0.03 mL of extra vinegar.",
    },
    {
      id: "c08",
      text: "Burette reading: read the bottom of the concave meniscus at eye level, to the nearest 0.01 mL. A Class-A 50 mL burette has 0.1 mL graduations; the last digit is estimated between marks. Reading from above or below eye level (parallax) shifts the reading by ~0.1 mL — avoid by placing the eye at the meniscus level with a white background.",
    },
    {
      id: "c09",
      text: "Air bubble check: after filling the burette, tap the tip and expel any air bubble by opening the stopcock briefly. A bubble left in the tip collapses during titration and appears as extra volume delivered, biasing the result high.",
    },
    {
      id: "c10",
      text: "Analyte preparation: use a small intermediate beaker to draw vinegar from the stock bottle (do NOT pipette from the stock bottle). Pipette 5.00 mL vinegar into a 250 mL Erlenmeyer, add ~20 mL DI water to rinse the walls (water dilutes total volume, not moles of acid), then add 5 drops of phenolphthalein.",
    },
    {
      id: "c11",
      text: "Titration technique: swirl the flask continuously with the non-dominant hand while controlling the stopcock with the dominant hand. Initially the pink flashes at the drop point vanish quickly; as the endpoint approaches the flashes persist longer. Slow to drop-wise addition and finally to half-drops rinsed off the tip with DI water.",
    },
    {
      id: "c12",
      text: "Expected numbers for household 5 % vinegar and 0.100 M NaOH with a 5.00 mL sample: moles of acetic acid ≈ 5.00 mL × 1.00 g/mL × 0.050 / 60.05 g/mol ≈ 4.16 × 10⁻³ mol; molarity of acetic acid ≈ 0.833 M; equivalence volume of NaOH ≈ 41.6 mL. Household vinegar molarity is normally in the 0.5–1.0 M range.",
    },
    {
      id: "c13",
      text: "Density assumption: this experiment assumes vinegar density = 1.00 g/mL. The true value is ~1.005 g/mL, which is a ~0.5 % systematic shift on the mass-percent result. Fine for a two-sig-fig answer.",
    },
    {
      id: "c14",
      text: "Calculation chain: (1) mean V_NaOH from the two palest trials; (2) moles NaOH = M × V_NaOH_in_L; (3) moles acetic acid = moles NaOH (1:1); (4) molarity of acetic acid = moles / 0.00500 L; (5) mass acetic acid = moles × 60.05 g/mol; (6) mass vinegar = 5.00 mL × 1.00 g/mL; (7) % w/w = mass acid / mass vinegar × 100.",
    },
    {
      id: "c15",
      text: "Precision target: three trials should agree within ± 0.20 mL of average volume. Lab convention: keep the TWO PALEST endpoints (the two most likely to be closest to equivalence). A trial with a clearly darker pink is dropped.",
    },
    {
      id: "c16",
      text: "Error budget: burette reading ± 0.05 mL each end contributes ~0.24 % relative error at 41.6 mL. Endpoint judgment (one drop = 0.05 mL over the endpoint) contributes ~0.12 % if consistent, more if not. Volumetric pipette 5.00 ± 0.02 mL is 0.4 %. The 1.00 g/mL density assumption vs the true 1.005 g/mL is a ~0.5 % systematic shift.",
    },
    {
      id: "c17",
      text: "Waste disposal: at the end of the lab, the neutralized flask contents (sodium acetate solution + water) go into the aqueous waste jug, not down the sink. Rinse the burette with DI water and leave inverted with the stopcock open.",
    },
    {
      id: "c18",
      text: "Common wrong turn — dark endpoint: student titrates to a clear pink or magenta and reports 5.5–6.0 % instead of ~5.0 %. Fix: next trial, slow to drop-wise as soon as the pink flash lingers more than a second.",
    },
    {
      id: "c19",
      text: "Common wrong turn — water rinse only: all three trials read high because titrant near the stopcock is more dilute than 0.100 M. Fix: drain the burette, rinse three times with titrant, refill.",
    },
    {
      id: "c20",
      text: "Common wrong turn — blowing out the pipette: adds ~0.02–0.03 mL extra vinegar per trial, biases moles of acid up. Fix: touch off, do not blow out.",
    },
    {
      id: "c21",
      text: "Common wrong turn — dividing by total flask volume: student computes molarity as moles / 0.025 L (5 mL vinegar + 20 mL water) instead of moles / 0.00500 L. The 20 mL of water was added just to make the endpoint easier to see; it does not change the moles of acetic acid that were originally in the 5.00 mL of vinegar.",
    },
    {
      id: "c22",
      text: "Safety: 0.1 M NaOH is a strong base that causes eye damage and skin burns. Splash goggles are mandatory. NaOH-on-skin: rinse for 15 minutes. Neutralize spills with sodium bicarbonate before wiping.",
    },
    {
      id: "c23",
      text: "Feedback style (Hattie & Timperley): an effective hint tells the student (a) where they are relative to the goal, (b) what small next action to try, (c) why that action matters. Never just 'wrong' or 'right'.",
    },
  ],
};
