/**
 * Simulated Order Book - DEMO MODE
 * Generates fake bids/asks and recent trades. No real matching engine.
 * Refreshes every 2 seconds.
 */
const OrderBook = (() => {
    let midPrice = 3200; // Starting mid price for ETH-USDT
    let prevPrice = 3200;
    let intervalId = null;

    function randomAround(n, variance) {
        return n + (Math.random() - 0.5) * variance * 2;
    }

    function generateOrders(mid, count, isBid) {
        const orders = [];
        for (let i = 0; i < count; i++) {
            const offset = (i + 1) * (isBid ? -1 : 1) * (Math.random() * 5 + 1);
            const price = parseFloat((mid + offset).toFixed(2));
            const amount = parseFloat((Math.random() * 5 + 0.1).toFixed(4));
            orders.push({ price, amount, total: parseFloat((price * amount).toFixed(2)) });
        }
        return isBid ? orders.reverse() : orders;
    }

    function renderOrders(orders, tbody, cls) {
        tbody.innerHTML = orders.map(o =>
            `<tr class="${cls}"><td>${o.price.toFixed(2)}</td><td>${o.amount.toFixed(4)}</td><td>${o.total.toFixed(2)}</td></tr>`
        ).join('');
    }

    function generateTrades(mid, count) {
        const trades = [];
        const now = Date.now();
        for (let i = 0; i < count; i++) {
            const price = parseFloat(randomAround(mid, mid * 0.001).toFixed(2));
            const amount = parseFloat((Math.random() * 2 + 0.01).toFixed(4));
            const time = new Date(now - i * 15000);
            trades.push({ price, amount, time: time.toLocaleTimeString() });
        }
        return trades;
    }

    function refresh() {
        const pair = document.getElementById('tradingPair')?.value || 'ETH-USDT';

        // Adjust mid price based on pair
        if (pair === 'BTC-USDT') midPrice = midPrice < 1000 ? 65000 : midPrice;
        else if (pair === 'ETH-USDT') midPrice = midPrice > 60000 ? 3200 : midPrice;
        else if (pair === 'BTC-ETH') midPrice = midPrice > 60000 ? 20 : midPrice;

        // Random walk
        midPrice += (Math.random() - 0.5) * midPrice * 0.002;

        const asks = generateOrders(midPrice, 10, false).sort((a, b) => a.price - b.price);
        const bids = generateOrders(midPrice, 10, true).sort((a, b) => b.price - a.price);
        const trades = generateTrades(midPrice, 15);

        renderOrders(asks, document.getElementById('asksTable'), 'table-danger');
        renderOrders(bids, document.getElementById('bidsTable'), 'table-success');

        document.getElementById('lastPrice').textContent = midPrice.toFixed(2);
        const changeElem = document.getElementById('priceChange');
        const diff = midPrice - prevPrice;
        changeElem.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(2);
        changeElem.className = 'ms-2 ' + (diff >= 0 ? 'text-success' : 'text-danger');
        prevPrice = midPrice;

        // Render trades
        const tradesTable = document.getElementById('tradesTable');
        tradesTable.innerHTML = trades.map(t => {
            const cls = t.price >= midPrice ? 'text-success' : 'text-danger';
            return `<tr><td class="${cls}">${t.price.toFixed(2)}</td><td>${t.amount.toFixed(4)}</td><td>${t.time}</td></tr>`;
        }).join('');

        // Update symbol displays
        const symbols = pair.split('-');
        document.getElementById('buySymbol').textContent = symbols[0];
        document.getElementById('sellSymbol').textContent = symbols[0];
    }

    function start() {
        refresh();
        intervalId = setInterval(refresh, 2000);
    }

    function restart() {
        if (intervalId) clearInterval(intervalId);
        if (document.getElementById('tradingPair')?.value === 'BTC-USDT') midPrice = 65000;
        else if (document.getElementById('tradingPair')?.value === 'ETH-USDT') midPrice = 3200;
        else midPrice = 20;
        refresh();
        intervalId = setInterval(refresh, 2000);
    }

    function placeTrade(side) {
        const amount = document.getElementById(side + 'Amount')?.value;
        const pair = document.getElementById('tradingPair')?.value || 'ETH-USDT';
        alert(`DEMO MODE: ${side.toUpperCase()} order for ${amount} ${pair} not executed.\n\nThis is a simulated trading interface. No real orders are placed.`);
    }

    document.addEventListener('DOMContentLoaded', start);

    return { start, restart, placeTrade };
})();
