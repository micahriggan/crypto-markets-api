import * as express from 'express';
import * as ccxt from 'ccxt';
import { ExchangeService } from './services/ExchangeMarkets';
const app = express();

app.use('/exchanges', (req, res) => {
  res.send(ccxt.exchanges);
});

app.use('/prices/:pair/:exchange', async (req, res) => {
  const pair = req.params.pair;
  const ticker = await ExchangeService.ticker(pair);
  const filtered = ticker.filter(t => t.exchange === req.params.exchange);
  if (filtered) {
    res.send(filtered);
  } else {
    res.send({});
  }
});

app.use('/prices/:pair', async (req, res) => {
  const pair = req.params.pair;
  const ticker = await ExchangeService.ticker(pair);
  if (ticker) {
    res.send(ticker);
  } else {
    res.send({});
  }
});

app.use('/prices', async (req, res) => {
  const tickers = await ExchangeService.tickers();
  res.send(tickers);
});

const port = 4000;
app.listen(port, () => {
  ExchangeService.montior();
  console.log(`App listening on port ${port} `);
});
