import * as ccxt from 'ccxt';
import * as fs from 'fs';
import { Ticker } from 'ccxt';
import { SymbolTickers } from 'crypto-markets-client';

const persistTo = 'tickers.json';

export type StorageTicker = { type: string; date: Date; tickers: SymbolTickers };

export class ExchangeService {
  private static _tickers: SymbolTickers = {};
  private static _isFetching = false;

  static needTickers() {
    return Object.keys(this._tickers).length === 0;
  }

  static async tickers() {
    if (this.needTickers()) {
      await this.fetchAndStore();
    }
    return this._tickers;
  }

  static async ticker(pair) {
    if (this.needTickers()) {
      await this.fetchAndStore();
    }
    const alt_pair = pair.replace('_', '/');
    const ticker = this._tickers[pair] || this._tickers[alt_pair];
    return ticker;
  }

  static async tickerForExchange(pair, exchange) {
    const found = await this.ticker(pair);
    const filtered = found.filter(t => t.exchange === exchange);
    return filtered;
  }

  static async fetchTickers() {
    let allFetches = [];
    const fetchedTickers: SymbolTickers = {};
    for (let key of ccxt.exchanges) {
      const exchange: ccxt.Exchange = new ccxt[key]();
      if (exchange.has.publicAPI) {
        try {
          const fetch = exchange
            .fetchTickers()
            .then(tickers => {
              console.log('Loading ', key);
              for (let ticker of Object.values(tickers)) {
                if (!fetchedTickers[ticker.symbol]) {
                  fetchedTickers[ticker.symbol] = [];
                }
                fetchedTickers[ticker.symbol].push({
                  ticker,
                  exchange: key
                });
              }
            })
            .catch(() => {
              console.log('Failed to load', key);
            });
          allFetches.push(fetch);
        } catch (err) {
          console.log('Failed to load', key);
        }
      }
    }
    await Promise.all(allFetches);
    console.log('Fetched', Object.keys(fetchedTickers).length, 'tickers');
    return fetchedTickers;
  }

  static async load() {
    if (fs.existsSync(persistTo)) {
      const file = fs.readFileSync(persistTo, 'utf8');
      if (file) {
        const payload = JSON.parse(file.toString()) as StorageTicker;
        return payload;
      }
    }
  }

  static cacheTickers(tickers: SymbolTickers) {
    this._tickers = tickers;
  }

  static async store(tickers: SymbolTickers) {
    this.cacheTickers(tickers);
    const payload = { type: 'tickers', date: new Date(), tickers };
    return fs.writeFileSync(persistTo, JSON.stringify(payload));
  }

  static async fetchAndStore() {
    const tickers = await ExchangeService.fetchTickers();
    await this.store(tickers);
  }

  static async montior() {
    const loaded = await ExchangeService.load();
    if(loaded) {
      this.cacheTickers(loaded.tickers);
    }
    if (this.needTickers()) {
      await this.fetchAndStore();
    } else {
      console.log('Monitor started with ', Object.keys(this._tickers).length, 'tickers');
    }
    setInterval(async () => {
      this.fetchAndStore();
    }, 5 * 60 * 1000);
  }
}
