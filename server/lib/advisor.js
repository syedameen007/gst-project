function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(Number.isFinite(value) ? value : 0));
}

function amountFromQuestion(question) {
  const lakhMatch = question.match(/([\d,.]+)\s*lakh/i);
  if (lakhMatch) return Number(lakhMatch[1].replace(/,/g, "")) * 100000;

  const numberMatch = question.match(/(?:₹|rs\.?|inr)?\s*([\d,]{4,})/i);
  if (numberMatch) return Number(numberMatch[1].replace(/,/g, ""));

  return null;
}

export function advisorReply(question, model, prediction) {
  const text = question.toLowerCase();
  const amount = amountFromQuestion(question);

  if (amount || text.includes("what if") || text.includes("invest")) {
    const trial = amount ?? model.plannedInvestment;
    const trial80c = Math.min(trial, model.remaining80c);
    const trialNps = Math.min(Math.max(0, trial - trial80c), model.remainingNps);
    const projected = trial * Math.pow(1 + (prediction?.monthlyReturn || model.returnRate / 12), model.projectionYears * 12);

    return `If you invest ${money(trial)}, fill ${money(trial80c)} of 80C first and ${money(trialNps)} of NPS next. The ML-assisted projected value is ${money(projected)}, with confidence ${Math.round((prediction?.confidence || 0.62) * 100)}%.`;
  }

  if (text.includes("gst") || text.includes("itc") || text.includes("credit")) {
    return `Your output GST is ${money(model.outputGst)} and eligible ITC found is ${money(model.eligibleItc)}. Claiming the ${money(model.itcGap)} ITC gap can reduce GST payable to ${money(model.gstAfter)} after invoice checks.`;
  }

  if (text.includes("portfolio") || text.includes("allocation")) {
    return `Portfolio value is ${money(model.currentPortfolio)} with ${model.portfolioGain >= 0 ? "gain" : "loss"} of ${money(Math.abs(model.portfolioGain))}. The ML return forecast is ${Math.round((prediction?.monthlyReturn || 0) * 10000) / 100}% for the next modeled month.`;
  }

  if (text.includes("regime") || text.includes("old") || text.includes("new")) {
    return `The modeled winner is the ${model.bestRegime} regime. Old regime after deductions is ${money(model.oldAfter.total)}; new regime is ${money(model.newTax.total)}.`;
  }

  return `You can reduce tax by combining ${money(model.itcGap)} of eligible ITC claims with ${money(model.allocate80c + model.allocateNps)} of tax-saving investments. Current modeled total reduction is ${money(model.totalSaved)}.`;
}
