export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'tickers required' });

  const symbols = tickers.split(',').map(t => t.trim() + '.SA').join(',');

  // Try v8 chart API for each ticker individually
  const result = {};
  const tickerList = tickers.split(',').map(t => t.trim());

  await Promise.all(tickerList.map(async (ticker) => {
    try {
      const symbol = ticker + '.SA';
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d&includePrePost=false`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://finance.yahoo.com/',
          'Origin': 'https://finance.yahoo.com',
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const r = data?.chart?.result?.[0];
      if (!r) return;

      const meta = r.meta;
      const price = meta.regularMarketPrice;
      const prev  = meta.chartPreviousClose ?? meta.previousClose;
      const pct   = prev ? ((price - prev) / prev) * 100 : null;

      result[ticker] = {
        price,
        pct,
        open: meta.regularMarketOpen,
        high: meta.regularMarketDayHigh,
        low:  meta.regularMarketDayLow,
        prev,
      };
    } catch (e) {
      // skip failed ticker
    }
  }));

  res.status(200).json(result);
}
