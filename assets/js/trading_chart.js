/**
 * Real-time Candlestick Chart using Lightweight Charts + Binance API.
 * Supports timeframe switching, pair switching, and live WebSocket updates.
 */
const TradingChart = (() => {
    // ── Configuration ──
    const PAIR_MAP = {
        'BTC-USDT': 'btcusdt',
        'ETH-USDT': 'ethusdt',
        'BTC-ETH':  'ethbtc',
    };
    const REST_BASE  = 'https://api.binance.com/api/v3/klines';
    const WS_BASE    = 'wss://stream.binance.com:9443/ws';
    const LIMIT      = 500;

    let chart       = null;
    let candleSeries = null;
    let ws          = null;
    let currentPair = 'ETH-USDT';
    let currentInterval = '1m';
    let lastCloseTime   = 0;
    let loadingOverlay  = null;

    // ── Binance REST → Lightweight Charts format ──
    function formatKlines(raw) {
        return raw.map(k => ({
            time:  Math.floor(k[0] / 1000),  // openTime in seconds
            open:  parseFloat(k[1]),
            high:  parseFloat(k[2]),
            low:   parseFloat(k[3]),
            close: parseFloat(k[4]),
        }));
    }

    // ── Fetch historical klines ──
    async function fetchHistory(symbol, interval) {
        const url = `${REST_BASE}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${LIMIT}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const raw = await resp.json();
        return formatKlines(raw);
    }

    // ── Initialize Lightweight Charts ──
    function initChart() {
        if (chart) {
            chart.remove();
            chart = null;
        }

        const container = document.getElementById('chart-container');
        chart = LightweightCharts.createChart(container, {
            width:      container.offsetWidth,
            height:     420,
            layout: {
                background: { color: '#1a1a2e' },
                textColor:  '#d1d4dc',
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            timeScale: {
                borderColor: 'rgba(106, 13, 173, 0.4)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(106, 13, 173, 0.4)',
            },
        });

        candleSeries = chart.addCandlestickSeries({
            upColor:         '#4caf50',
            downColor:       '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor:   '#4caf50',
            wickDownColor:   '#ef5350',
            wickUpColor:     '#4caf50',
        });

        // Resize handler
        const ro = new ResizeObserver(() => {
            if (chart && container) chart.resize(container.offsetWidth, 420);
        });
        ro.observe(container);
    }

    // ── Load data into chart ──
    async function loadData(pair, interval) {
        showLoading(true);
        const symbol = PAIR_MAP[pair] || 'btcusdt';
        try {
            const data = await fetchHistory(symbol, interval);
            if (data.length > 0) {
                lastCloseTime = data[data.length - 1].time;
            }
            candleSeries.setData(data);
            chart.timeScale().fitContent();
        } catch (err) {
            console.error('Chart fetch error:', err);
        }
        showLoading(false);
    }

    // ── WebSocket connection ──
    function connectWebSocket(pair, interval) {
        disconnectWebSocket();
        const symbol = (PAIR_MAP[pair] || 'btcusdt').toLowerCase();
        const stream = `${symbol}@kline_${interval}`;
        const url    = `${WS_BASE}/${stream}`;

        ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('[Chart] WebSocket connected:', stream);
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (!msg.k) return;

            const k   = msg.k;
            const bar = {
                time:  Math.floor(k.t / 1000),
                open:  parseFloat(k.o),
                high:  parseFloat(k.h),
                low:   parseFloat(k.l),
                close: parseFloat(k.c),
            };

            if (k.x) {
                // Candle closed — finalize current, next tick will start a new one
                lastCloseTime = bar.time;
            }
            candleSeries.update(bar);

            // Update chart header label
            const label = document.getElementById('chartPairLabel');
            if (label) {
                const price = bar.close;
                const change = bar.close - bar.open;
                const pct    = bar.open ? ((change / bar.open) * 100).toFixed(2) : 0;
                const sign   = change >= 0 ? '+' : '';
                const color  = change >= 0 ? '#4caf50' : '#ef5350';
                label.innerHTML = `${pair} <span style="color:${color}">${price.toFixed(2)} (${sign}${pct}%)</span>`;
            }
        };

        ws.onerror = (err) => {
            console.error('[Chart] WebSocket error:', err);
        };

        ws.onclose = (e) => {
            console.log('[Chart] WebSocket closed:', e.code, e.reason);
            if (!e.wasClean) {
                setTimeout(() => {
                    if (currentPair === pair && currentInterval === interval) {
                        connectWebSocket(pair, interval);
                    }
                }, 3000);
            }
        };
    }

    function disconnectWebSocket() {
        if (ws) {
            ws.onclose = null; // prevent auto-reconnect
            ws.close();
            ws = null;
        }
    }

    // ── Loading overlay ──
    function showLoading(show) {
        if (!loadingOverlay) loadingOverlay = document.getElementById('chart-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'block' : 'none';
        }
    }

    // ── Timeframe switch ──
    function setTimeframe(tf) {
        if (currentInterval === tf) return;
        currentInterval = tf;

        // Update button active state
        document.querySelectorAll('#timeframeButtons button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tf === tf);
        });

        // Reload with new interval
        loadData(currentPair, currentInterval).then(() => {
            connectWebSocket(currentPair, currentInterval);
        });
    }

    // ── Pair switch ──
    function setPair(pair) {
        if (currentPair === pair) return;
        currentPair = pair;
        loadData(pair, currentInterval).then(() => {
            connectWebSocket(pair, currentInterval);
        });
    }

    // ── Bootstrap ──
    function start() {
        initChart();

        // Listen for pair changes (order book also listens, we cooperate)
        const pairSelect = document.getElementById('tradingPair');
        if (pairSelect) {
            currentPair = pairSelect.value;
            pairSelect.addEventListener('change', () => {
                setPair(pairSelect.value);
            });
        }

        // Timeframe button listeners
        document.querySelectorAll('#timeframeButtons button').forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeframe(btn.dataset.tf);
            });
        });

        // Initial load
        loadData(currentPair, currentInterval).then(() => {
            connectWebSocket(currentPair, currentInterval);
        });
    }

    document.addEventListener('DOMContentLoaded', start);

    return { setPair, setTimeframe };
})();
