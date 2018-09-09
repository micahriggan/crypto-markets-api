import { ExchangeService } from './ExchangeMarkets';
import { ExchangeTicker } from '../../../crypto-markets-client/ts_build';

export type ArbitrageOpportunity = {
  spread: number;
  buy: ExchangeTicker;
  sell: ExchangeTicker;
};
export class MetricService {
  static async getSpread(pair, exchange) {
    const tickers = await ExchangeService.tickerForExchange(pair, exchange);
    return tickers.map(t => {
      return {
        symbol: t.ticker.symbol,
        spread: t.ticker.ask - t.ticker.bid
      };
    });
  }

  static async getArbitrageOpportunities() {
    const tickers = await ExchangeService.tickers();
    const opportunities = new Array<ArbitrageOpportunity>();
    for (let exchangeTickers of Object.values(tickers)) {
      let buy: ExchangeTicker = exchangeTickers[0];
      let sell: ExchangeTicker = exchangeTickers[0];
      for (let exchangeTicker of exchangeTickers) {
        if (exchangeTicker.ticker.bid > sell.ticker.bid) {
          sell = exchangeTicker;
        }
        if (exchangeTicker.ticker.bid < buy.ticker.bid) {
          buy = exchangeTicker;
        }
      }
      const spread = sell.ticker.bid - buy.ticker.bid;
      if (spread > 0) {
        opportunities.push({ buy, sell, spread });
      }
    }
    return opportunities.sort((a, b) => {
      return b.spread - a.spread;
    });
  }
}
