# Purpose
To provide a simple server to montior multiple exchanges for crypto prices

Currently fetches 7834 tickers from 100+ exchanges

# Usage / Install
```
npm install
npm start

# List exchanges
curl http://localhost:4000/exchanges

# All tickers for all exchanges
curl http://localhost:4000/prices

# All exchanges for BTC_USD
curl http://localhost:4000/prices/BTC_USD

# Bitfinex for pair BTC_USDT
curl http://localhost:4000/prices/BTC_USDT/bitfinex
```
