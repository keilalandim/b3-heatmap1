export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: 'tickers required' });

  const symbols = tickers.split(',').map(t => t.trim() + '.SA').join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketPreviousClose`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];

    const result = {};
    for (const q of quotes) {
      const ticker = q.symbol.replace('.SA', '');
      result[ticker] = {
        price: q.regularMarketPrice,
        pct:   q.regularMarketChangePercent,
        open:  q.regularMarketOpen,
        high:  q.regularMarketDayHigh,
        low:   q.regularMarketDayLow,
        prev:  q.regularMarketPreviousClose,
      };
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
