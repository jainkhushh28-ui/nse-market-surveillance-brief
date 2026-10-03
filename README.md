# Market Surveillance Brief

A free, local prototype for compliance teams monitoring listed entities. Choose a company from the watchlist and it retrieves NSE MCP data to create a factual, timestamped market-surveillance brief—no event description or legal questionnaire required.

## Run it

1. Install a recent Node.js release (v18+).
2. Open this folder in VS Code.
3. In the terminal, run `npm start`.
4. Open `http://localhost:3000`.

No package installation, account, or API key is required.

## What it demonstrates

- One-click review of 30-day volume behaviour, 52-week range context, and corporate actions for a monitored company.
- A factual, downloadable briefing note and prompts for a compliance professional to investigate through approved channels.
- Server-side integration with NSE's Bhavcopy MCP. The app uses the MCP `initialize` and `tools/call` flow directly, so NSE data is never exposed through a browser-to-NSE call.

## Important limits

This is educational software, not legal advice, a finding of insider trading or a disclosure breach, investment advice, or a filing system. Verify current LODR, PIT, exchange, sectoral, contractual and internal-policy obligations with qualified advisers. NSE’s MCP page describes its data as informational/educational and restricts commercial use; obtain written rights before any external or commercial deployment.
