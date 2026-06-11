# Gold Trading Platform MVP

This is an MVP for a unique Gold Trading Platform with strict trading windows and automated rewards.

## Features & Rules
1. **Trading Window**: 
   - At the beginning of each hour (XX:00 to XX:10), there is a waiting period of 10 minutes.
   - You only have a **5-minute window** (XX:10 to XX:15) to place an order (Buy/Sell Gold).
   - Clicking order buttons outside this period will prompt you to read the rules.
2. **Rules Tab**: Located at the top right, providing full details of how the platform operates.
3. **Admin Panel**: An administrative view to track all user records, trades, deposits, and withdrawal requests. Access via `/admin`.
4. **Live Price**: Integration with Binance API (XAUUSDT) to display real-time live gold prices.
5. **Fixed TP and SL**: Every trade automatically applies a fixed Take Profit (TP) and Stop Loss (SL) of 10 pips.
6. **Order Execution**: 
   - Users can select the quantity (lot size).
   - If TP hits, the user earns a fixed reward of **40 RS** per trade.
7. **Wallet Management**:
   - Initial balance is zero.
   - Users can make deposits to fund their demo account.
   - Withdrawal requests are immediately deducted from the balance and sent to the Admin Panel for approval.

## Technologies Used
- Frontend: React.js, Vite
- Routing: React Router Dom
- Styling: Custom Vanilla CSS (Beautiful, premium UI with glassmorphism)
- Icons: Lucide React
- Live Data: Binance Public API WebSocket / REST

## How to Run
1. Ensure you have Node.js installed.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Navigate to `http://localhost:5173` to view the app.

## Missing Points Addressed
- **Authentication**: Added a simple username entry to identify the user before trading.
- **Trade Monitoring**: Simulated checking for Take Profit and Stop Loss against live prices.
- **State Persistence**: Uses React Context with `localStorage` to mock a database for the MVP.
- **Real-time Price Updates**: Implemented using continuous polling or WebSocket from Binance to ensure accurate trade execution.
