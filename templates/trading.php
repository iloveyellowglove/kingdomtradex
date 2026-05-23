<?php
/**
 * Trading Interface
 * Live order book data. Real-time Binance chart integration.
 */
$title = 'Trading - KingdomTradex';
$extraHead = '<script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>'
          . '<script src="/assets/js/trading_chart.js" defer></script>'
          . '<script src="/assets/js/orderbook.js" defer></script>';
require __DIR__ . '/header.php';
?>

<div class="row mb-3">
    <div class="col">
        <h2><i class="bi bi-graph-up-arrow"></i> Trading Terminal</h2>
        <p class="text-muted">Live order book with real-time Binance chart data</p>
    </div>
    <div class="col text-end align-self-center">
        <span class="me-2">Pair:</span>
        <select class="form-select d-inline-block w-auto" id="tradingPair" onchange="OrderBook.restart()">
            <option value="BTC-USDT">BTC/USDT</option>
            <option value="ETH-USDT" selected>ETH/USDT</option>
            <option value="BTC-ETH">BTC/ETH</option>
        </select>
    </div>
</div>

<div class="row">
    <!-- Order Book -->
    <div class="col-md-4 trading-orderbook">
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-book"></i> Order Book</h6>
                <small class="text-muted">Live order book</small>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-sm table-borderless mb-0">
                        <thead class="table-danger">
                            <tr>
                                <th>Price</th>
                                <th>Amount</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="asksTable">
                            <tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="text-center py-2 bg-light border-top border-bottom">
                    <strong id="lastPrice" class="fs-5">--</strong>
                    <small class="text-muted ms-2" id="priceChange"></small>
                </div>
                <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                    <table class="table table-sm table-borderless mb-0">
                        <thead class="table-success">
                            <tr>
                                <th>Price</th>
                                <th>Amount</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody id="bidsTable">
                            <tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Real Candlestick Chart + Trade Form -->
    <div class="col-md-8 trading-chart-col">
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-graph-up"></i> Price Chart <small class="text-muted" id="chartPairLabel">BTC/USDT</small></h6>
                <div class="btn-group btn-group-sm" id="timeframeButtons">
                    <button class="btn btn-outline-light active" data-tf="1m">1m</button>
                    <button class="btn btn-outline-light" data-tf="5m">5m</button>
                    <button class="btn btn-outline-light" data-tf="15m">15m</button>
                    <button class="btn btn-outline-light" data-tf="1h">1h</button>
                    <button class="btn btn-outline-light" data-tf="4h">4h</button>
                    <button class="btn btn-outline-light" data-tf="1d">1d</button>
                </div>
            </div>
            <div class="card-body p-0 bg-dark rounded-bottom position-relative">
                <div id="chart-container" style="width:100%;height:420px;"></div>
                <div id="chart-loading" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#FFD700;z-index:10;pointer-events:none;">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>Loading chart...
                </div>
                <small class="text-muted position-absolute bottom-0 end-0 m-1" style="font-size:10px;">Real-time data from Binance</small>
            </div>
        </div>

        <!-- Trade Buttons -->
        <div class="row">
            <div class="col-6">
                <div class="card border-success">
                    <div class="card-body text-center">
                        <h5 class="text-success">Buy</h5>
                        <div class="mb-3">
                            <label class="form-label">Amount (<span id="buySymbol">USDT</span>)</label>
                            <input type="number" class="form-control" id="buyAmount" step="0.01" value="100">
                        </div>
                        <button class="btn btn-success w-100" onclick="OrderBook.placeTrade('buy')">
                            <i class="bi bi-cart-plus"></i> Buy
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-6">
                <div class="card border-danger">
                    <div class="card-body text-center">
                        <h5 class="text-danger">Sell</h5>
                        <div class="mb-3">
                            <label class="form-label">Amount (<span id="sellSymbol">USDT</span>)</label>
                            <input type="number" class="form-control" id="sellAmount" step="0.01" value="50">
                        </div>
                        <button class="btn btn-danger w-100" onclick="OrderBook.placeTrade('sell')">
                            <i class="bi bi-cart-dash"></i> Sell
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Trades -->
        <div class="card mt-3">
            <div class="card-header"><h6 class="mb-0"><i class="bi bi-list-ul"></i> Recent Trades</h6></div>
            <div class="card-body p-0">
                <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-sm mb-0">
                        <thead><tr><th>Price</th><th>Amount</th><th>Time</th></tr></thead>
                        <tbody id="tradesTable">
                            <tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div><!-- /col-md-8 -->
</div><!-- /row -->

<div class="mt-3">
    <a href="/dashboard.php" class="btn btn-outline-secondary"><i class="bi bi-arrow-left"></i> Back to Dashboard</a>
</div>

<?php require __DIR__ . '/footer.php'; ?>
