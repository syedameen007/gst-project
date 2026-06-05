export const DEFAULT_INPUTS = {
  annualIncome: 1200000,
  current80c: 55000,
  currentNps: 15000,
  plannedInvestment: 50000,
  outputGst: 240000,
  claimedItc: 135000,
  eligibleItc: 178000,
  expenseScore: 74,
  costBasis: 420000,
  currentPortfolio: 512000,
  returnRate: 10,
  projectionYears: 5,
  simAmount: 50000,
};

export const TAX_RULES = {
  eightyCLimit: 150000,
  npsLimit: 50000,
  cessRate: 0.04,
  old: {
    rebateThreshold: 500000,
    rebateCap: 12500,
    brackets: [
      { limit: 250000, rate: 0 },
      { limit: 500000, rate: 0.05 },
      { limit: 1000000, rate: 0.2 },
      { limit: Infinity, rate: 0.3 },
    ],
  },
  new: {
    rebateThreshold: 1200000,
    rebateCap: 60000,
    brackets: [
      { limit: 400000, rate: 0 },
      { limit: 800000, rate: 0.05 },
      { limit: 1200000, rate: 0.1 },
      { limit: 1600000, rate: 0.15 },
      { limit: 2000000, rate: 0.2 },
      { limit: 2400000, rate: 0.25 },
      { limit: Infinity, rate: 0.3 },
    ],
  },
};

export function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(Number.isFinite(value) ? value : 0));
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function slabTax(income, brackets) {
  let tax = 0;
  let lower = 0;

  for (const bracket of brackets) {
    const taxableInBracket = Math.max(0, Math.min(income, bracket.limit) - lower);
    tax += taxableInBracket * bracket.rate;
    if (income <= bracket.limit) break;
    lower = bracket.limit;
  }

  return tax;
}

export function calculateTax(taxableIncome, regime) {
  const rules = TAX_RULES[regime];
  const taxable = Math.max(0, taxableIncome);
  const baseTax = slabTax(taxable, rules.brackets);
  const rebate =
    taxable <= rules.rebateThreshold ? Math.min(baseTax, rules.rebateCap) : 0;
  const afterRebate = Math.max(0, baseTax - rebate);
  const cess = afterRebate * TAX_RULES.cessRate;

  return {
    taxable,
    baseTax,
    rebate,
    cess,
    total: Math.round(afterRebate + cess),
  };
}

export function buildModel(inputs, regime = "old") {
  const income = Math.max(0, Number(inputs.annualIncome) || 0);
  const current80c = Math.min(
    Math.max(0, Number(inputs.current80c) || 0),
    TAX_RULES.eightyCLimit,
  );
  const currentNps = Math.min(
    Math.max(0, Number(inputs.currentNps) || 0),
    TAX_RULES.npsLimit,
  );
  const plannedInvestment = Math.max(0, Number(inputs.plannedInvestment) || 0);
  const outputGst = Math.max(0, Number(inputs.outputGst) || 0);
  const claimedItc = Math.min(Math.max(0, Number(inputs.claimedItc) || 0), outputGst);
  const eligibleItc = Math.min(Math.max(0, Number(inputs.eligibleItc) || 0), outputGst);
  const costBasis = Math.max(0, Number(inputs.costBasis) || 0);
  const currentPortfolio = Math.max(0, Number(inputs.currentPortfolio) || 0);
  const expenseScore = clamp(Math.max(0, Number(inputs.expenseScore) || 0), 0, 100);
  const returnRate = Math.max(0, Number(inputs.returnRate) || 0) / 100;
  const projectionYears = clamp(Math.round(Number(inputs.projectionYears) || 1), 1, 30);
  const simAmount = Math.max(0, Number(inputs.simAmount) || 0);

  const remaining80c = Math.max(0, TAX_RULES.eightyCLimit - current80c);
  const remainingNps = Math.max(0, TAX_RULES.npsLimit - currentNps);
  const allocate80c = Math.min(plannedInvestment, remaining80c);
  const allocateNps = Math.min(
    Math.max(0, plannedInvestment - allocate80c),
    remainingNps,
  );
  const overflow = Math.max(0, plannedInvestment - allocate80c - allocateNps);

  const deductionsBefore = current80c + currentNps;
  const deductionsAfter = current80c + currentNps + allocate80c + allocateNps;
  const oldBefore = calculateTax(income - deductionsBefore, "old");
  const oldAfter = calculateTax(income - deductionsAfter, "old");
  const newTax = calculateTax(income, "new");
  const selectedBefore = regime === "old" ? oldBefore : newTax;
  const bestAfter = oldAfter.total <= newTax.total ? oldAfter : newTax;
  const bestRegime = oldAfter.total <= newTax.total ? "Old" : "New";

  const gstBefore = Math.max(0, outputGst - claimedItc);
  const gstAfter = Math.max(0, outputGst - eligibleItc);
  const itcGap = Math.max(0, eligibleItc - claimedItc);
  const taxBeforeTotal = selectedBefore.total + gstBefore;
  const taxAfterTotal = bestAfter.total + gstAfter;
  const incomeTaxSaved = Math.max(0, selectedBefore.total - bestAfter.total);
  const totalSaved = Math.max(0, taxBeforeTotal - taxAfterTotal);
  const projectedInvestmentValue =
    plannedInvestment * Math.pow(1 + returnRate, projectionYears);
  const portfolioGain = currentPortfolio - costBasis;
  const portfolioReturn = costBasis > 0 ? portfolioGain / costBasis : 0;

  const sim80c = Math.min(simAmount, remaining80c);
  const simNps = Math.min(Math.max(0, simAmount - sim80c), remainingNps);
  const simTax = calculateTax(income - (deductionsBefore + sim80c + simNps), "old");
  const simBestTax = Math.min(simTax.total, newTax.total);
  const simTaxReduction = Math.max(0, selectedBefore.total - simBestTax);
  const simProjectedValue = simAmount * Math.pow(1 + returnRate, projectionYears);

  return {
    income,
    current80c,
    currentNps,
    plannedInvestment,
    outputGst,
    claimedItc,
    eligibleItc,
    costBasis,
    currentPortfolio,
    expenseScore,
    returnRate,
    projectionYears,
    simAmount,
    remaining80c,
    remainingNps,
    allocate80c,
    allocateNps,
    overflow,
    deductionsBefore,
    deductionsAfter,
    oldBefore,
    oldAfter,
    newTax,
    selectedBefore,
    bestAfter,
    bestRegime,
    gstBefore,
    gstAfter,
    itcGap,
    taxBeforeTotal,
    taxAfterTotal,
    incomeTaxSaved,
    totalSaved,
    projectedInvestmentValue,
    portfolioGain,
    portfolioReturn,
    sim80c,
    simNps,
    simTaxReduction,
    simProjectedValue,
  };
}

export function recommendations(model) {
  const taxAfter80c = calculateTax(
    model.income - (model.deductionsBefore + model.allocate80c),
    "old",
  );
  const taxSave80c = Math.max(0, model.oldBefore.total - taxAfter80c.total);
  const taxSaveNps = Math.max(0, taxAfter80c.total - model.oldAfter.total);
  const regimeDelta = Math.abs(model.oldAfter.total - model.newTax.total);

  return [
    {
      title:
        model.allocate80c > 0
          ? `Invest ${money(model.allocate80c)} in 80C instruments`
          : "80C limit already used",
      body:
        model.allocate80c > 0
          ? `Estimated income tax reduction: ${money(taxSave80c)}.`
          : "No additional 80C gap remains in the current model.",
      tag: "80C",
      tone: "green",
    },
    {
      title:
        model.allocateNps > 0
          ? `Add ${money(model.allocateNps)} to NPS Tier I`
          : "NPS 80CCD(1B) gap closed",
      body:
        model.allocateNps > 0
          ? `Estimated income tax reduction: ${money(taxSaveNps)}.`
          : "The extra NPS bucket is fully used or the proposed amount is allocated elsewhere.",
      tag: "NPS",
      tone: "blue",
    },
    {
      title:
        model.itcGap > 0
          ? `Claim ${money(model.itcGap)} eligible ITC`
          : "GST credit reconciled",
      body:
        model.itcGap > 0
          ? `GST payable can drop from ${money(model.gstBefore)} to ${money(model.gstAfter)}.`
          : "Claimed ITC already matches the eligible credit found.",
      tag: "GST",
      tone: "amber",
    },
    {
      title: `${model.bestRegime} regime is stronger`,
      body: `Modeled difference between old and new regime after optimization: ${money(regimeDelta)}.`,
      tag: "Regime",
      tone: model.bestRegime === "Old" ? "green" : "rose",
    },
  ];
}

export function riskSignals(model) {
  const itcRatio = model.outputGst ? model.eligibleItc / model.outputGst : 0;
  const deductionUse =
    (model.current80c + model.currentNps) /
    (TAX_RULES.eightyCLimit + TAX_RULES.npsLimit);

  return [
    {
      level: model.claimedItc > model.eligibleItc ? "high" : itcRatio > 0.82 ? "medium" : "low",
      title: "ITC ratio check",
      body:
        model.claimedItc > model.eligibleItc
          ? "Claimed ITC is above the eligible credit found."
          : `Eligible ITC is ${Math.round(itcRatio * 100)}% of output GST.`,
    },
    {
      level: model.expenseScore < 55 ? "high" : model.expenseScore < 75 ? "medium" : "low",
      title: "Expense evidence quality",
      body: `Invoice completeness score: ${Math.round(model.expenseScore)} / 100.`,
    },
    {
      level: model.itcGap > 50000 ? "medium" : "low",
      title: "Unclaimed credit gap",
      body: `${money(model.itcGap)} of eligible GST credit is not yet claimed.`,
    },
    {
      level: deductionUse < 0.45 ? "medium" : "low",
      title: "Tax-saving allocation gap",
      body: `${Math.round(deductionUse * 100)}% of modeled deduction capacity is already used.`,
    },
  ];
}

export function portfolioAllocation(model) {
  return [
    {
      name: "ELSS / PPF / EPF",
      amount: model.allocate80c,
      capacity: model.remaining80c,
      tag: "80C",
      color: "#14d9a5",
    },
    {
      name: "NPS Tier I",
      amount: model.allocateNps,
      capacity: model.remainingNps,
      tag: "NPS",
      color: "#8e7cff",
    },
    {
      name: "GST compliance buffer",
      amount: model.itcGap,
      capacity: model.outputGst,
      tag: "ITC",
      color: "#ffb84d",
    },
    {
      name: "Tax-neutral liquidity",
      amount: model.overflow,
      capacity: model.plannedInvestment,
      tag: "Buffer",
      color: "#66c7f4",
    },
  ];
}
