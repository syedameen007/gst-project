import { calculateTax, money, TAX_RULES } from "./taxEngine";

function amountFromQuestion(question) {
  const lakhMatch = question.match(/([\d,.]+)\s*lakh/i);
  if (lakhMatch) return Number(lakhMatch[1].replace(/,/g, "")) * 100000;

  const numberMatch = question.match(/(?:₹|rs\.?|inr)?\s*([\d,]{4,})/i);
  if (numberMatch) return Number(numberMatch[1].replace(/,/g, ""));

  return null;
}

export function advisorReply(question, model) {
  const text = question.toLowerCase();
  const amount = amountFromQuestion(question);

  if (amount || text.includes("what if") || text.includes("invest")) {
    const trial = amount ?? model.plannedInvestment;
    const trial80c = Math.min(trial, model.remaining80c);
    const trialNps = Math.min(Math.max(0, trial - trial80c), model.remainingNps);
    const trialTax = calculateTax(
      model.income - (model.deductionsBefore + trial80c + trialNps),
      "old",
    );
    const taxReduction = Math.max(
      0,
      model.selectedBefore.total - Math.min(trialTax.total, model.newTax.total),
    );
    const projected = trial * Math.pow(1 + model.returnRate, model.projectionYears);

    return `If you invest ${money(trial)}, fill ${money(trial80c)} of 80C first and ${money(trialNps)} of NPS next. Estimated tax reduction is ${money(taxReduction)}, with projected value of ${money(projected)} after ${model.projectionYears} years.`;
  }

  if (text.includes("gst") || text.includes("itc") || text.includes("credit")) {
    return `Your output GST is ${money(model.outputGst)} and eligible ITC found is ${money(model.eligibleItc)}. Claiming the ${money(model.itcGap)} ITC gap can reduce GST payable to ${money(model.gstAfter)} after invoice checks.`;
  }

  if (text.includes("portfolio") || text.includes("allocation")) {
    return `Portfolio value is ${money(model.currentPortfolio)} with ${model.portfolioGain >= 0 ? "gain" : "loss"} of ${money(Math.abs(model.portfolioGain))}. Keep the portfolio tax-aware: 80C instruments, NPS, and GST working-capital savings before tax-neutral assets.`;
  }

  if (text.includes("regime") || text.includes("old") || text.includes("new")) {
    return `The modeled winner is the ${model.bestRegime} regime. Old regime after deductions is ${money(model.oldAfter.total)}; new regime is ${money(model.newTax.total)}.`;
  }

  if (text.includes("80c")) {
    return `You have ${money(model.remaining80c)} of 80C capacity left. The modeled combined cap for 80C, 80CCC, and 80CCD(1) is ${money(TAX_RULES.eightyCLimit)}.`;
  }

  return `You can reduce tax by combining ${money(model.itcGap)} of eligible ITC claims with ${money(model.allocate80c + model.allocateNps)} of tax-saving investments. Current modeled total reduction is ${money(model.totalSaved)}.`;
}
