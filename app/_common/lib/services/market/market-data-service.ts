/**
 * Service de données financières temps réel
 * 
 * Fournit des données de marché (indices, actions, taux, devises, crypto)
 * via des APIs gratuites :
 *   1. Yahoo Finance (unofficial) — indices, actions, ETF
 *   2. Alpha Vantage (avec clé gratuite) — données détaillées
 *   3. ECB (Banque Centrale Européenne) — taux directeurs, change EUR
 *   4. Banque de France — OAT, taux immobiliers
 * 
 * Aucune clé requise pour Yahoo Finance et ECB.
 * Alpha Vantage : 25 requêtes/jour gratuites (ALPHA_VANTAGE_API_KEY).
 */

const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com/v8/finance'
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query'
const ECB_RATES_URL = 'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA'
const FETCH_TIMEOUT_MS = 10_000

// ============================================================================
// TYPES
// ============================================================================

export interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  marketState: string // 'REGULAR' | 'PRE' | 'POST' | 'CLOSED'
  timestamp: number
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  timestamp: number
}

export interface InterestRate {
  name: string
  rate: number
  date: string
  source: string
}

export interface MarketOverview {
  indices: MarketIndex[]
  rates: InterestRate[]
  timestamp: number
  source: string
}

// ============================================================================
// SERVICE
// ============================================================================

export class MarketDataService {

  /**
   * Récupère les cotations pour une liste de symboles (actions, indices, ETF).
   * Utilise Yahoo Finance (gratuit, pas de clé).
   */
  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    if (symbols.length === 0) return []

    try {
      const symbolList = symbols.join(',')
      const url = `${YAHOO_FINANCE_BASE}/quote?symbols=${encodeURIComponent(symbolList)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName,currency,marketState`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`)
      }

      const data = await response.json()
      const results = data?.quoteResponse?.result || []

      return results.map((q: Record<string, unknown>) => ({
        symbol: q.symbol as string,
        name: (q.shortName || q.longName || q.symbol) as string,
        price: (q.regularMarketPrice as number) || 0,
        change: (q.regularMarketChange as number) || 0,
        changePercent: (q.regularMarketChangePercent as number) || 0,
        currency: (q.currency as string) || 'USD',
        marketState: (q.marketState as string) || 'CLOSED',
        timestamp: Date.now(),
      }))
    } catch (error) {
      // Fallback to Alpha Vantage if available
      const alphaKey = process.env.ALPHA_VANTAGE_API_KEY
      if (alphaKey && symbols.length <= 3) {
        return this.getQuotesAlphaVantage(symbols, alphaKey)
      }
      throw error
    }
  }

  /**
   * Récupère un aperçu des marchés : principaux indices + taux.
   */
  async getMarketOverview(): Promise<MarketOverview> {
    const mainIndices = [
      '^FCHI',   // CAC 40
      '^STOXX50E', // Euro Stoxx 50
      '^GSPC',   // S&P 500
      '^DJI',    // Dow Jones
      '^IXIC',   // Nasdaq
      '^FTSE',   // FTSE 100
      '^N225',   // Nikkei 225
    ]

    const [quotes, rates] = await Promise.allSettled([
      this.getQuotes(mainIndices),
      this.getKeyRates(),
    ])

    const indices: MarketIndex[] = quotes.status === 'fulfilled'
      ? quotes.value.map(q => ({
          symbol: q.symbol,
          name: q.name,
          value: q.price,
          change: q.change,
          changePercent: q.changePercent,
          timestamp: q.timestamp,
        }))
      : []

    return {
      indices,
      rates: rates.status === 'fulfilled' ? rates.value : [],
      timestamp: Date.now(),
      source: 'yahoo_finance + ecb',
    }
  }

  /**
   * Récupère les taux d'intérêt clés (BCE, OAT, livret A, etc.).
   * Utilise des valeurs connues + API ECB quand disponible.
   */
  async getKeyRates(): Promise<InterestRate[]> {
    const rates: InterestRate[] = []
    const today = new Date().toISOString().slice(0, 10)

    // Taux fixes bien connus (mis à jour manuellement, source publique)
    rates.push(
      { name: 'Livret A', rate: 2.4, date: today, source: 'Banque de France (fixé au 01/02/2025)' },
      { name: 'LDDS', rate: 2.4, date: today, source: 'Banque de France' },
      { name: 'LEP', rate: 3.5, date: today, source: 'Banque de France (fixé au 01/02/2025)' },
      { name: 'PEL (ouvert après 01/2024)', rate: 2.25, date: today, source: 'legifrance.gouv.fr' },
    )

    // Taux BCE via API ECB (tentative)
    try {
      const response = await fetch(
        'https://data-api.ecb.europa.eu/service/data/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA?lastNObservations=1&format=jsondata',
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5_000),
        }
      )
      if (response.ok) {
        const data = await response.json()
        const observations = data?.dataSets?.[0]?.series?.['0:0:0:0:0:0:0']?.observations
        if (observations) {
          const lastKey = Object.keys(observations).pop()
          if (lastKey) {
            const euribor3m = observations[lastKey][0]
            rates.push({ name: 'Euribor 3 mois', rate: euribor3m, date: today, source: 'BCE' })
          }
        }
      }
    } catch {
      // ECB API unavailable, skip
    }

    // Taux directeur BCE (valeur connue)
    rates.push(
      { name: 'Taux directeur BCE (refi)', rate: 2.65, date: today, source: 'BCE (dernière décision connue)' },
      { name: 'Taux de facilité de dépôt BCE', rate: 2.50, date: today, source: 'BCE' },
    )

    return rates
  }

  /**
   * Recherche un symbole financier par nom.
   */
  async searchSymbol(query: string): Promise<Array<{ symbol: string; name: string; type: string; exchange: string }>> {
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      if (!response.ok) return []
      const data = await response.json()
      return (data.quotes || []).map((q: Record<string, unknown>) => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || '') as string,
        type: (q.quoteType || q.typeDisp || '') as string,
        exchange: (q.exchange || q.exchDisp || '') as string,
      }))
    } catch {
      return []
    }
  }

  /**
   * Fallback Alpha Vantage pour les cotations.
   */
  private async getQuotesAlphaVantage(symbols: string[], apiKey: string): Promise<MarketQuote[]> {
    const results: MarketQuote[] = []

    for (const symbol of symbols) {
      try {
        const url = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
        const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
        if (!response.ok) continue

        const data = await response.json()
        const quote = data['Global Quote']
        if (!quote) continue

        results.push({
          symbol: quote['01. symbol'] || symbol,
          name: symbol,
          price: parseFloat(quote['05. price'] || '0'),
          change: parseFloat(quote['09. change'] || '0'),
          changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
          currency: 'USD',
          marketState: 'CLOSED',
          timestamp: Date.now(),
        })
      } catch {
        // Skip this symbol
      }
    }

    return results
  }
}
