import * as ccxt from 'ccxt';
import * as fs from 'fs';
import { Ticker } from 'ccxt';
import { SymbolTickers } from 'crypto-markets-client';

const persistTo = 'persist/tickers';


export class ExchangeService {
  private static _tickers: SymbolTickers = {};
  private static _isFetching = false;

  static needTickers() {
    return Object.keys(this._tickers).length === 0;
  }
  static async tickers() {
    if (this.needTickers()) {
      console.log('Getting tickers');
      this._tickers = await this.fetchTickers();
    }
    return this._tickers;
  }

  static async ticker(pair) {
    if (this.needTickers()) {
      console.log('Getting tickers');
      await this.fetchTickers();
    }
    const alt_pair = pair.replace('_', '/');
    const ticker = this._tickers[pair] || this._tickers[alt_pair];
    return ticker;
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
    await Promise.all<SymbolTickers>(allFetches);
    return fetchedTickers;
  }

  static async load() {
    if(fs.existsSync(persistTo)) {
      const file = fs.readFileSync(persistTo, 'utf8');
      if (file) {
        const payload = JSON.parse(file.toString()) as StorageTicker;
      }
    }
  }

  static async cacheTickers(tickers: SymbolTickers) {
      this._tickers = tickers;
  }

  static async store(tickers: SymbolTickers) {
    const payload = { type: 'tickers', date: new Date(), tickers };
    return fs.writeFileSync(persistTo, JSON.stringify(payload));
  }

  static async fetchAndStore() {
    const tickers = await ExchangeService.fetchTickers();
    console.log('Fetched', Object.keys(tickers).length, 'tickers');
    await this.store(tickers);
  }

  static async montior() {
    await ExchangeService.load();
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
