(function () {
  const DEFAULT_FX = {
    USD: 7.2,
    HKD: 0.92,
    CNY: 1
  };

  async function fetchStockPrice(symbol) {
    const cleanSymbol = normalizeSymbol(symbol);
    if (!cleanSymbol) {
      throw new Error("请输入股票代码");
    }

    try {
      return await fetchTencentPrice(cleanSymbol);
    } catch (error) {
      try {
        return await fetchYahooPrice(cleanSymbol);
      } catch (fallbackError) {
        if (cleanSymbol.endsWith(".HK")) {
          return fetchStooqPrice(cleanSymbol);
        }
        throw fallbackError;
      }
    }
  }

  async function fetchTencentPrice(cleanSymbol) {
    const querySymbol = toTencentSymbol(cleanSymbol);
    const globalName = `v_${querySymbol}`;
    delete window[globalName];
    await loadScript(`https://qt.gtimg.cn/q=${encodeURIComponent(querySymbol)}`);
    const raw = window[globalName];
    delete window[globalName];
    if (!raw) throw new Error("股票价格查询失败");

    const parts = raw.split("~");
    const price = Number(parts[3]);
    if (!price) throw new Error("未查询到有效价格");

    return {
      symbol: cleanSymbol,
      price,
      currency: inferCurrency(cleanSymbol),
      source: "腾讯行情",
      time: new Date().toLocaleString("zh-CN")
    };
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = () => {
        script.remove();
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject(new Error("股票价格查询失败"));
      };
      document.head.appendChild(script);
    });
  }

  function toTencentSymbol(symbol) {
    if (symbol.endsWith(".HK")) {
      return `hk${symbol.replace(".HK", "")}`;
    }
    if (symbol.endsWith(".SS")) {
      return `sh${symbol.replace(".SS", "")}`;
    }
    if (symbol.endsWith(".SZ")) {
      return `sz${symbol.replace(".SZ", "")}`;
    }
    return `us${symbol.replace(/\.(N|O|A)$/i, "")}`;
  }

  async function fetchYahooPrice(cleanSymbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?interval=1d&range=5d`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("股票价格查询失败");
    const data = await response.json();
    const result = data.chart && data.chart.result && data.chart.result[0];
    const price = result && result.meta && (result.meta.regularMarketPrice || result.meta.previousClose);
    const currency = result && result.meta && result.meta.currency;
    if (!price) {
      throw new Error("未查询到有效价格");
    }
    return {
      symbol: cleanSymbol,
      price: Number(price),
      currency: currency || inferCurrency(cleanSymbol),
      source: "Yahoo Finance",
      time: new Date().toLocaleString("zh-CN")
    };
  }

  async function fetchStooqPrice(cleanSymbol) {
    const stooqSymbol = toStooqSymbol(cleanSymbol);
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("股票价格查询失败");
    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/);
    const values = lines[1] ? lines[1].split(",") : [];
    const close = Number(values[6]);
    if (!close) throw new Error("未查询到有效价格");
    return {
      symbol: cleanSymbol,
      price: close,
      currency: inferCurrency(cleanSymbol),
      source: "Stooq",
      time: new Date().toLocaleString("zh-CN")
    };
  }

  function normalizeSymbol(symbol) {
    const cleanSymbol = (symbol || "").trim().toUpperCase();
    const hkMatch = cleanSymbol.match(/^(\d{1,5})\.HK$/);
    if (hkMatch) {
      return `${hkMatch[1].padStart(5, "0")}.HK`;
    }
    return cleanSymbol;
  }

  function toStooqSymbol(symbol) {
    if (symbol.endsWith(".HK")) {
      return `${String(Number(symbol.replace(".HK", "")))}.HK`;
    }
    return symbol;
  }

  async function fetchFxRates() {
    const response = await fetch("https://api.frankfurter.app/latest?from=CNY&to=USD,HKD");
    if (!response.ok) {
      throw new Error("汇率查询失败");
    }
    const data = await response.json();
    return {
      USD: roundRate(1 / data.rates.USD),
      HKD: roundRate(1 / data.rates.HKD),
      CNY: 1,
      date: data.date
    };
  }

  function inferCurrency(symbol) {
    if (symbol.endsWith(".HK")) return "HKD";
    if (symbol.endsWith(".SS") || symbol.endsWith(".SZ")) return "CNY";
    return "USD";
  }

  function fxForCurrency(currency, rates) {
    const key = (currency || "USD").toUpperCase();
    return rates[key] || DEFAULT_FX[key] || 1;
  }

  function roundRate(value) {
    return Math.round(value * 10000) / 10000;
  }

  window.StockService = {
    fetchStockPrice,
    fetchFxRates,
    inferCurrency,
    normalizeSymbol,
    fxForCurrency,
    DEFAULT_FX
  };
})();
