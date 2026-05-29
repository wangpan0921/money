(function () {
  const STORAGE_KEY = "annual-income-calculator-v1";
  const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const STOCK_PRESETS = [
    { name: "手动填写", symbol: "" },
    { name: "阿里巴巴 BABA", symbol: "BABA" },
    { name: "阿里巴巴 9988.HK", symbol: "9988.HK" },
    { name: "腾讯 00700.HK", symbol: "00700.HK" },
    { name: "美团 03690.HK", symbol: "03690.HK" },
    { name: "京东 JD", symbol: "JD" },
    { name: "京东 09618.HK", symbol: "09618.HK" },
    { name: "百度 BIDU", symbol: "BIDU" },
    { name: "百度 09888.HK", symbol: "09888.HK" },
    { name: "拼多多 PDD", symbol: "PDD" },
    { name: "网易 NTES", symbol: "NTES" },
    { name: "网易 09999.HK", symbol: "09999.HK" },
    { name: "小米 01810.HK", symbol: "01810.HK" },
    { name: "快手 01024.HK", symbol: "01024.HK" },
    { name: "理想 LI", symbol: "LI" },
    { name: "理想 02015.HK", symbol: "02015.HK" },
    { name: "蔚来 NIO", symbol: "NIO" },
    { name: "小鹏 XPEV", symbol: "XPEV" },
    { name: "比亚迪 01211.HK", symbol: "01211.HK" },
    { name: "哔哩哔哩 BILI", symbol: "BILI" }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function init() {
    renderMonthInputs();
    addRsuRow({ symbol: "AAPL", shares: 0, month: 12, price: 0, currency: "USD" });
    bindEvents();
    restore();
    toggleBonusInputs();
    toggleRentTier();
  }

  function bindEvents() {
    $("#btnFillSalary").addEventListener("click", () => {
      const salary = numberOf("#defaultSalary");
      $$(".salary-input").forEach((input) => {
        input.value = salary;
        input.dataset.manual = "false";
      });
      updateComputedBonus();
      toast("已应用到 12 个月", "success");
    });
    $("#defaultSalary").addEventListener("input", syncDefaultSalary);

    $("#bonusMode").addEventListener("change", () => {
      toggleBonusInputs();
      updateComputedBonus();
    });
    $("#bonusMultiplier").addEventListener("input", updateComputedBonus);
    $("#btnAddRsu").addEventListener("click", () => addRsuRow({ symbol: "", shares: 0, month: 12, price: 0, currency: "USD" }));
    $("#btnCalc").addEventListener("click", calculateAndRender);
    $("#btnSave").addEventListener("click", save);
    $("#btnReset").addEventListener("click", reset);
    $("#btnFetchFx").addEventListener("click", fetchFx);
    $("#housingType").addEventListener("change", toggleRentTier);
  }

  function renderMonthInputs() {
    $("#monthGrid").innerHTML = MONTHS.map((label, index) => `
      <div class="month-cell">
        <label>${label} 应发税前
          <input class="salary-input" data-month="${index + 1}" data-manual="false" type="number" min="0" step="1000" value="${numberOf("#defaultSalary") || 30000}" />
        </label>
      </div>
    `).join("");
    $$(".salary-input").forEach((input) => {
      input.addEventListener("input", () => {
        input.dataset.manual = "true";
        updateComputedBonus();
      });
    });
  }

  function syncDefaultSalary() {
    const salary = numberOf("#defaultSalary");
    $$(".salary-input").forEach((input) => {
      if (input.dataset.manual !== "true") {
        input.value = salary;
      }
    });
    updateComputedBonus();
  }

  function addRsuRow(data) {
    const row = document.createElement("div");
    row.className = "rsu-row";
    row.dataset.price = data.price || 0;
    row.dataset.currency = data.currency || "USD";
    row.innerHTML = `
      <label>常见公司
        <select class="rsu-preset">
          ${STOCK_PRESETS.map((item) => `<option value="${item.symbol}" ${item.symbol && item.symbol === data.symbol ? "selected" : ""}>${item.name}</option>`).join("")}
        </select>
      </label>
      <label>股票代码
        <input class="rsu-symbol" type="text" placeholder="AAPL / 0700.HK" value="${escapeHtml(data.symbol || "")}" />
      </label>
      <label>股数
        <input class="rsu-shares" type="number" min="0" step="1" value="${data.shares || 0}" />
      </label>
      <label>归属月份
        <input class="rsu-month" type="number" min="1" max="12" value="${data.month || 12}" />
      </label>
      <div class="computed-field stock-price">
        <span>单价</span>
        <strong class="rsu-price-text">${formatQuote(data.price || 0, data.currency || "USD")}</strong>
      </div>
      <button class="btn-price" type="button">查询</button>
      <button class="btn-del" type="button">删除</button>
      <div class="price-meta">${escapeHtml(data.meta || "输入股票代码后自动查询价格")}</div>
    `;

    $(".btn-del", row).addEventListener("click", () => row.remove());
    $(".btn-price", row).addEventListener("click", () => fetchRowPrice(row));
    $(".rsu-preset", row).addEventListener("change", () => {
      const symbol = $(".rsu-preset", row).value;
      if (!symbol) {
        $(".rsu-symbol", row).focus();
        return;
      }
      $(".rsu-symbol", row).value = symbol;
      row.dataset.price = 0;
      $(".rsu-price-text", row).textContent = "待查询";
      fetchRowPrice(row);
    });
    $(".rsu-symbol", row).addEventListener("input", () => {
      const preset = $(".rsu-preset", row);
      if (preset.value !== $(".rsu-symbol", row).value) {
        preset.value = "";
      }
    });
    $(".rsu-symbol", row).addEventListener("change", () => fetchRowPrice(row));
    $(".rsu-symbol", row).addEventListener("blur", () => {
      if (!Number(row.dataset.price)) fetchRowPrice(row);
    });
    $("#rsuList").appendChild(row);
  }

  async function fetchRowPrice(row) {
    const button = $(".btn-price", row);
    const symbol = $(".rsu-symbol", row).value;
    button.disabled = true;
    button.textContent = "...";
    try {
      const quote = await StockService.fetchStockPrice(symbol);
      row.dataset.price = TaxEngine.money(quote.price);
      row.dataset.currency = quote.currency;
      $(".rsu-symbol", row).value = quote.symbol;
      $(".rsu-price-text", row).textContent = formatQuote(quote.price, quote.currency);
      $(".price-meta", row).textContent = `${quote.source} ${quote.time}，${quote.symbol} ${quote.currency} ${quote.price}`;
      toast("股票价格已更新", "success");
    } catch (error) {
      $(".price-meta", row).textContent = error.message;
      toast(error.message, "error");
    } finally {
      button.disabled = false;
      button.textContent = "查询";
    }
  }

  async function fetchFx() {
    const button = $("#btnFetchFx");
    button.disabled = true;
    button.textContent = "...";
    try {
      const rates = await StockService.fetchFxRates();
      setFxRate("USD", rates.USD);
      setFxRate("HKD", rates.HKD);
      toast(`汇率已更新：${rates.date}`, "success");
    } catch (error) {
      toast(error.message, "error");
    } finally {
      button.disabled = false;
      button.textContent = "刷新汇率";
    }
  }

  function toggleBonusInputs() {
    const mode = $("#bonusMode").value;
    $("#bonusAmountWrap").hidden = mode !== "amount";
    $("#bonusMultWrap").hidden = mode !== "multiplier";
    $("#bonusComputedWrap").hidden = mode !== "multiplier";
  }

  function updateComputedBonus() {
    const node = $("#bonusComputedAmount");
    if (!node) return;
    node.textContent = TaxEngine.formatCurrency(computedBonusByMultiplier());
  }

  function computedBonusByMultiplier() {
    const salaries = $$(".salary-input").map((input) => numberFrom(input));
    const averageSalary = salaries.reduce((sum, item) => sum + item, 0) / 12;
    return TaxEngine.money(averageSalary * numberOf("#bonusMultiplier"));
  }

  function collectInput() {
    const salaries = $$(".salary-input").map((input) => numberFrom(input));
    const bonusGross = $("#bonusMode").value === "multiplier"
      ? computedBonusByMultiplier()
      : numberOf("#bonusAmount");
    const fxRates = {
      USD: numberFromText("#fxRateText") || StockService.DEFAULT_FX.USD,
      HKD: numberFromText("#fxHkdText") || StockService.DEFAULT_FX.HKD,
      CNY: 1
    };
    const deduction = collectSpecialDeduction();

    return {
      salaries,
      bonus: {
        gross: TaxEngine.money(bonusGross),
        taxMode: $("#bonusTaxMode").value,
        month: numberOf("#bonusMonth") || 12
      },
      settings: {
        siBase: numberOf("#siBase"),
        hfBase: numberOf("#hfBase"),
        rateEndowment: numberOf("#rateEndowment"),
        rateMedical: numberOf("#rateMedical"),
        rateUnemp: numberOf("#rateUnemp"),
        rateHf: numberOf("#rateHf")
      },
      deductions: {
        monthly: deduction.monthly,
        medicalAnnual: deduction.medicalAnnual,
        items: deduction.items
      },
      stockTaxMode: $("#rsuTaxMode").value,
      stockItems: $$(".rsu-row").map((row) => {
        const currency = row.dataset.currency || StockService.inferCurrency($(".rsu-symbol", row).value);
        return {
          symbol: $(".rsu-symbol", row).value.trim(),
          shares: numberFrom($(".rsu-shares", row)),
          month: numberFrom($(".rsu-month", row)) || 12,
          price: Number(row.dataset.price) || 0,
          currency,
          fxRate: StockService.fxForCurrency(currency, fxRates)
        };
      }).filter((item) => item.shares > 0 && item.price > 0)
    };
  }

  function collectSpecialDeduction() {
    const child = numberOf("#childCount") * 2000 * numberOf("#childShare");
    const infant = numberOf("#infantCount") * 2000 * numberOf("#infantShare");
    const education = numberOf("#educationType");
    const housingType = $("#housingType").value;
    const mortgage = housingType === "mortgage" ? 1000 : 0;
    const rent = housingType === "rent" ? numberOf("#rentTier") : 0;
    const elder = numberOf("#elderType");
    const medicalAnnual = numberOf("#medicalAnnualDeduction");
    const items = [
      { label: "子女教育", monthly: child, detail: `${numberOf("#childCount")} 人，${shareText("#childShare")}` },
      { label: "3岁以下婴幼儿照护", monthly: infant, detail: `${numberOf("#infantCount")} 人，${shareText("#infantShare")}` },
      { label: "继续教育", monthly: education, detail: education === 400 ? "学历继续教育" : education === 300 ? "职业资格 3600/年折月" : "无" },
      { label: "住房贷款利息", monthly: mortgage, detail: mortgage ? "首套住房贷款利息" : "未选择" },
      { label: "住房租金", monthly: rent, detail: rent ? $("#rentTier").selectedOptions[0].textContent : "未选择" },
      { label: "赡养老人", monthly: elder, detail: elder ? $("#elderType").selectedOptions[0].textContent : "无" },
      { label: "大病医疗", monthly: medicalAnnual / 12, annual: medicalAnnual, detail: medicalAnnual ? "年度可扣除额折月" : "无" }
    ];

    return {
      monthly: TaxEngine.money(items.filter((item) => item.label !== "大病医疗").reduce((sum, item) => sum + item.monthly, 0)),
      medicalAnnual,
      items
    };
  }

  function shareText(selector) {
    return numberOf(selector) === 1 ? "本人 100%" : "本人 50%";
  }

  function calculateAndRender() {
    const input = collectInput();
    const result = TaxEngine.calculateAnnualIncome(input);
    renderResults(result, input);
  }

  function renderResults(result, input) {
    $("#results").innerHTML = `
      <div class="summary-cards">
        ${summaryCard("年度总收入", result.grossTotal, "income")}
        ${summaryCard("到手实际金额", result.takeHome, "takehome")}
        ${summaryCard("个人税费合计", result.personalTaxTotal + result.socialTotal + result.housingTotal, "tax")}
        ${summaryCard("到手率", `${result.netRate}%`, "effective", false)}
      </div>
      ${renderAdvice(result)}
      ${renderIncomeBreakdown(result)}
      ${renderDeductionBreakdown(input)}
      ${renderTaxBreakdown(result)}
      ${renderStockBreakdown(result)}
      ${renderMonthlyTable(result)}
    `;
  }

  function summaryCard(label, value, className, currency = true) {
    return `
      <div class="card ${className}">
        <div class="label">${label}</div>
        <div class="value">${currency ? TaxEngine.formatCurrency(value) : value}</div>
      </div>
    `;
  }

  function renderAdvice(result) {
    const compare = result.bonusCompare;
    const selectedText = compare.selected === "separate" ? "全年一次性奖金单独计税" : "并入综合所得计税";
    const saved = Math.abs(compare.separateTax - compare.combinedTax);
    return `
      <div class="advice">
        年终奖采用 <strong>${selectedText}</strong>。单独计税 ${TaxEngine.formatCurrency(compare.separateTax)}，并入综合所得 ${TaxEngine.formatCurrency(compare.combinedTax)}，差额 ${TaxEngine.formatCurrency(saved)}。
        单独计税口径：月均 ${TaxEngine.formatCurrency(compare.separateAvg)}，税率 ${TaxEngine.money(compare.separateRate * 100)}%，速算扣除 ${TaxEngine.formatCurrency(compare.separateQuick)}。
      </div>
    `;
  }

  function renderIncomeBreakdown(result) {
    return tableSection("收入明细", [
      ["工资薪金", result.salaryGross, "12 个月应发工资合计"],
      ["年终奖", result.bonusGross, `税后 ${TaxEngine.formatCurrency(result.bonusNet)}`],
      ["公司股票", result.stockGross, "按归属股数 × 单价 × 汇率折算"],
      ["合计", result.grossTotal, ""]
    ]);
  }

  function renderDeductionBreakdown(input) {
    const rows = input.deductions.items.map((item) => [
      item.label,
      item.annual || item.monthly * 12,
      item.monthly ? `每月 ${TaxEngine.formatCurrency(item.monthly)} · ${escapeHtml(item.detail)}` : escapeHtml(item.detail)
    ]);
    rows.push([
      "专项附加扣除合计",
      input.deductions.monthly * 12 + input.deductions.medicalAnnual,
      `月度项 ${TaxEngine.formatCurrency(input.deductions.monthly)}/月，大病医疗 ${TaxEngine.formatCurrency(input.deductions.medicalAnnual)}/年`
    ]);
    return tableSection("专项附加扣除明细", rows);
  }

  function renderTaxBreakdown(result) {
    return tableSection("税费明细", [
      ["综合所得个人所得税", result.comprehensiveTax, "工资、并入计税的奖金/股票"],
      ["年终奖个税", result.bonusTax, result.bonusCompare.selected === "separate" ? "全年一次性奖金单独计税" : "并入综合所得增量税额"],
      ["股票单独计税个税", result.separateStockTax, "选择股票单独计税时产生"],
      ["养老保险", result.monthlyContrib.pension * 12, `每月 ${TaxEngine.formatCurrency(result.monthlyContrib.pension)}`],
      ["医疗保险", result.monthlyContrib.medical * 12, `每月 ${TaxEngine.formatCurrency(result.monthlyContrib.medical)}`],
      ["失业保险", result.monthlyContrib.unemployment * 12, `每月 ${TaxEngine.formatCurrency(result.monthlyContrib.unemployment)}`],
      ["住房公积金", result.housingTotal, `每月 ${TaxEngine.formatCurrency(result.monthlyContrib.housingFund)}`],
      ["税费合计", result.personalTaxTotal + result.socialTotal + result.housingTotal, `个税有效税率 ${result.effectiveTaxRate}%`]
    ]);
  }

  function renderStockBreakdown(result) {
    const rows = result.stockItems.map((item) => [
      `${escapeHtml(item.symbol || "未命名")} · ${item.month}月`,
      item.grossCny,
      `${item.shares} 股 × ${item.currency} ${item.price} × 汇率 ${item.fxRate}`
    ]);
    if (!rows.length) return "";
    return tableSection("股票归属明细", rows);
  }

  function renderMonthlyTable(result) {
    return `
      <div class="breakdown">
        <h3>12 个月逐月明细</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th>工资</th>
                <th>并入收入</th>
                <th>社保公积金</th>
                <th>累计应纳税所得</th>
                <th>当月个税</th>
                <th>预计到手</th>
              </tr>
            </thead>
            <tbody>
              ${result.monthlyRows.map((row) => `
                <tr>
                  <td>${row.month}月</td>
                  <td>${fmt(row.salaryGross)}</td>
                  <td>${fmt(row.extraGross)}</td>
                  <td>${fmt(row.contributions.total)}</td>
                  <td>${fmt(row.cumulativeTaxable)}</td>
                  <td>${fmt(row.tax)}</td>
                  <td>${fmt(row.takeHome)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function tableSection(title, rows) {
    return `
      <div class="breakdown">
        <h3>${title}</h3>
        <table>
          <tbody>
            ${rows.map((row, index) => `
              <tr class="${index === rows.length - 1 ? "total" : ""}">
                <td>${row[0]}</td>
                <td>${fmt(row[1])}</td>
                <td>${row[2] || ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    toast("已保存到本地", "success");
  }

  function restore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      applySnapshot(JSON.parse(raw));
      toast("已恢复本地保存的数据", "success");
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  function snapshot() {
    const fields = {};
    $$("input, select").forEach((node) => {
      if (node.id) fields[node.id] = node.value;
    });
    const stocks = $$(".rsu-row").map((row) => ({
      symbol: $(".rsu-symbol", row).value,
      shares: $(".rsu-shares", row).value,
      month: $(".rsu-month", row).value,
      price: Number(row.dataset.price) || 0,
      currency: row.dataset.currency || "USD",
      meta: $(".price-meta", row).textContent
    }));
    return {
      fields,
      fxRates: {
        USD: numberFromText("#fxRateText"),
        HKD: numberFromText("#fxHkdText")
      },
      salaries: $$(".salary-input").map((input) => ({
        value: input.value,
        manual: input.dataset.manual === "true"
      })),
      stocks
    };
  }

  function applySnapshot(data) {
    Object.entries(data.fields || {}).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.value = value;
    });
    if (data.fxRates) {
      setFxRate("USD", data.fxRates.USD || StockService.DEFAULT_FX.USD);
      setFxRate("HKD", data.fxRates.HKD || StockService.DEFAULT_FX.HKD);
    }
    (data.salaries || []).forEach((item, index) => {
      const node = $$(".salary-input")[index];
      if (!node) return;
      if (typeof item === "object") {
        node.value = item.value;
        node.dataset.manual = item.manual ? "true" : "false";
      } else {
        node.value = item;
        node.dataset.manual = "true";
      }
    });
    $("#rsuList").innerHTML = "";
    (data.stocks || []).forEach(addRsuRow);
    if (!(data.stocks || []).length) addRsuRow({ symbol: "", shares: 0, month: 12, price: 0, currency: "USD" });
    toggleRentTier();
  }

  function toggleRentTier() {
    const rentTier = $("#rentTier");
    rentTier.disabled = $("#housingType").value !== "rent";
  }

  function numberOf(selector) {
    return numberFrom($(selector));
  }

  function numberFrom(input) {
    return Number(input.value) || 0;
  }

  function numberFromText(selector) {
    const node = $(selector);
    return Number(node.dataset.value) || Number(node.textContent) || 0;
  }

  function setFxRate(currency, value) {
    const node = currency === "HKD" ? $("#fxHkdText") : $("#fxRateText");
    node.dataset.value = value;
    node.textContent = value;
  }

  function formatQuote(price, currency) {
    const value = Number(price) || 0;
    return value ? `${currency} ${TaxEngine.money(value)}` : "待查询";
  }

  function fmt(value) {
    return TaxEngine.formatCurrency(value);
  }

  function toast(message, type) {
    let node = $(".toast");
    if (!node) {
      node = document.createElement("div");
      node.className = "toast";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.className = `toast show ${type || ""}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 2200);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
