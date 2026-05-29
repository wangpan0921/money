(function () {
  const ANNUAL_TAX_BRACKETS = [
    { limit: 36000, rate: 0.03, quick: 0 },
    { limit: 144000, rate: 0.10, quick: 2520 },
    { limit: 300000, rate: 0.20, quick: 16920 },
    { limit: 420000, rate: 0.25, quick: 31920 },
    { limit: 660000, rate: 0.30, quick: 52920 },
    { limit: 960000, rate: 0.35, quick: 85920 },
    { limit: Infinity, rate: 0.45, quick: 181920 }
  ];
  const MONTHLY_TAX_BRACKETS = [
    { limit: 3000, rate: 0.03, quick: 0 },
    { limit: 12000, rate: 0.10, quick: 210 },
    { limit: 25000, rate: 0.20, quick: 1410 },
    { limit: 35000, rate: 0.25, quick: 2660 },
    { limit: 55000, rate: 0.30, quick: 4410 },
    { limit: 80000, rate: 0.35, quick: 7160 },
    { limit: Infinity, rate: 0.45, quick: 15160 }
  ];

  function money(value) {
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  }

  function annualTax(taxable) {
    const base = Math.max(0, taxable);
    const bracket = ANNUAL_TAX_BRACKETS.find((item) => base <= item.limit);
    return money(Math.max(0, base * bracket.rate - bracket.quick));
  }

  function bracketInfo(taxable) {
    const base = Math.max(0, taxable);
    const bracket = ANNUAL_TAX_BRACKETS.find((item) => base <= item.limit);
    return {
      rate: bracket.rate,
      quick: bracket.quick,
      label: `${money(bracket.rate * 100)}% / 速算扣除 ${formatCurrency(bracket.quick)}`
    };
  }

  function bonusSeparateTax(gross) {
    const avg = Math.max(0, gross) / 12;
    const bracket = MONTHLY_TAX_BRACKETS.find((item) => avg <= item.limit);
    return {
      tax: money(Math.max(0, gross * bracket.rate - bracket.quick)),
      rate: bracket.rate,
      quick: bracket.quick,
      avg: money(avg)
    };
  }

  function monthlyContributions(settings) {
    const pension = settings.siBase * settings.rateEndowment / 100;
    const medical = settings.siBase * settings.rateMedical / 100;
    const unemployment = settings.siBase * settings.rateUnemp / 100;
    const housingFund = settings.hfBase * settings.rateHf / 100;
    return {
      pension: money(pension),
      medical: money(medical),
      unemployment: money(unemployment),
      socialTotal: money(pension + medical + unemployment),
      housingFund: money(housingFund),
      total: money(pension + medical + unemployment + housingFund)
    };
  }

  function calculateAnnualIncome(input) {
    const salaries = input.salaries.map((item) => Math.max(0, item));
    const stockItems = input.stockItems.map((item) => ({
      ...item,
      month: Math.min(12, Math.max(1, item.month || 1)),
      grossCny: money(Math.max(0, item.shares) * Math.max(0, item.price) * item.fxRate)
    }));
    const bonusGross = input.bonus.gross;
    const baseDeductionMonthly = 5000;
    const monthlyDeduction = input.deductions.monthly + input.deductions.medicalAnnual / 12;
    const contrib = monthlyContributions(input.settings);
    const combinedStockByMonth = Array.from({ length: 12 }, () => 0);
    const separateStock = [];

    stockItems.forEach((item) => {
      if (input.stockTaxMode === "separate") {
        separateStock.push(item);
      } else {
        combinedStockByMonth[item.month - 1] += item.grossCny;
      }
    });

    const salaryOnly = simulateComprehensive({
      salaries,
      extraByMonth: Array.from({ length: 12 }, () => 0),
      contrib,
      monthlyDeduction,
      baseDeductionMonthly
    });

    const bonusSeparate = bonusSeparateTax(bonusGross);
    const withBonusCombined = simulateComprehensive({
      salaries,
      extraByMonth: addToMonth(combinedStockByMonth, input.bonus.month, bonusGross),
      contrib,
      monthlyDeduction,
      baseDeductionMonthly
    });
    const withoutBonusCombined = simulateComprehensive({
      salaries,
      extraByMonth: combinedStockByMonth,
      contrib,
      monthlyDeduction,
      baseDeductionMonthly
    });
    const bonusCombinedTax = money(withBonusCombined.totalTax - withoutBonusCombined.totalTax);

    let selectedBonusMode = input.bonus.taxMode;
    if (selectedBonusMode === "auto") {
      selectedBonusMode = bonusSeparate.tax <= bonusCombinedTax ? "separate" : "combined";
    }

    const bonusTax = selectedBonusMode === "combined" ? bonusCombinedTax : bonusSeparate.tax;
    const bonusNet = money(bonusGross - bonusTax);
    const actualExtraByMonth = selectedBonusMode === "combined"
      ? addToMonth(combinedStockByMonth, input.bonus.month, bonusGross)
      : combinedStockByMonth;

    const monthlyResult = simulateComprehensive({
      salaries,
      extraByMonth: actualExtraByMonth,
      contrib,
      monthlyDeduction,
      baseDeductionMonthly
    });

    const separateStockTax = separateStock.reduce((sum, item) => sum + bonusSeparateTax(item.grossCny).tax, 0);
    const separateStockNet = money(separateStock.reduce((sum, item) => sum + item.grossCny, 0) - separateStockTax);
    const combinedStockGross = money(combinedStockByMonth.reduce((sum, item) => sum + item, 0));
    const combinedStockTax = money(monthlyResult.totalTax - salaryOnly.totalTax - (selectedBonusMode === "combined" ? bonusTax : 0));

    const salaryGross = money(salaries.reduce((sum, item) => sum + item, 0));
    const stockGross = money(stockItems.reduce((sum, item) => sum + item.grossCny, 0));
    const socialTotal = money(contrib.socialTotal * 12);
    const housingTotal = money(contrib.housingFund * 12);
    const comprehensiveTax = monthlyResult.totalTax;
    const personalTaxTotal = money(comprehensiveTax + (selectedBonusMode === "separate" ? bonusTax : 0) + separateStockTax);
    const grossTotal = money(salaryGross + bonusGross + stockGross);
    const takeHome = money(grossTotal - socialTotal - housingTotal - personalTaxTotal);

    const monthlyRows = monthlyResult.monthlyRows.map((row, index) => ({
      ...row,
      bonusGross: selectedBonusMode === "combined" && input.bonus.month === index + 1 ? bonusGross : 0,
      separateBonusGross: selectedBonusMode === "separate" && input.bonus.month === index + 1 ? bonusGross : 0,
      combinedStockGross: combinedStockByMonth[index],
      takeHome: money(row.salaryGross + row.extraGross - row.contributions.total - row.tax)
    }));

    if (selectedBonusMode === "separate" && bonusGross > 0) {
      const month = Math.min(12, Math.max(1, input.bonus.month)) - 1;
      monthlyRows[month].takeHome = money(monthlyRows[month].takeHome + bonusNet);
    }

    return {
      salaryGross,
      bonusGross,
      stockGross,
      grossTotal,
      takeHome,
      socialTotal,
      housingTotal,
      personalTaxTotal,
      comprehensiveTax,
      bonusTax,
      separateStockTax: money(separateStockTax),
      combinedStockTax: Math.max(0, combinedStockTax),
      bonusNet,
      separateStockNet,
      monthlyContrib: contrib,
      monthlyDeduction: money(monthlyDeduction),
      baseDeductionAnnual: baseDeductionMonthly * 12,
      monthlyRows,
      stockItems,
      separateStock,
      bonusCompare: {
        separateTax: bonusSeparate.tax,
        combinedTax: bonusCombinedTax,
        selected: selectedBonusMode,
        separateRate: bonusSeparate.rate,
        separateQuick: bonusSeparate.quick,
        separateAvg: bonusSeparate.avg
      },
      effectiveTaxRate: grossTotal > 0 ? money(personalTaxTotal / grossTotal * 100) : 0,
      netRate: grossTotal > 0 ? money(takeHome / grossTotal * 100) : 0
    };
  }

  function simulateComprehensive({ salaries, extraByMonth, contrib, monthlyDeduction, baseDeductionMonthly }) {
    let cumulativeIncome = 0;
    let cumulativeDeduction = 0;
    let cumulativeTax = 0;

    const monthlyRows = salaries.map((salary, index) => {
      const extra = extraByMonth[index] || 0;
      cumulativeIncome += salary + extra;
      cumulativeDeduction += baseDeductionMonthly + monthlyDeduction + contrib.total;
      const cumulativeTaxable = Math.max(0, cumulativeIncome - cumulativeDeduction);
      const taxDue = annualTax(cumulativeTaxable);
      const tax = money(Math.max(0, taxDue - cumulativeTax));
      cumulativeTax = money(cumulativeTax + tax);

      return {
        month: index + 1,
        salaryGross: money(salary),
        extraGross: money(extra),
        contributions: contrib,
        deduction: money(baseDeductionMonthly + monthlyDeduction),
        cumulativeTaxable: money(cumulativeTaxable),
        tax,
        bracket: bracketInfo(cumulativeTaxable)
      };
    });

    return { totalTax: money(cumulativeTax), monthlyRows };
  }

  function addToMonth(values, month, amount) {
    const next = values.slice();
    const index = Math.min(12, Math.max(1, month || 12)) - 1;
    next[index] = money((next[index] || 0) + amount);
    return next;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  window.TaxEngine = {
    calculateAnnualIncome,
    annualTax,
    bonusSeparateTax,
    formatCurrency,
    money
  };
})();
