# Smart Expense Tracker

A standalone web app prototype that tracks expenses from mobile payment SMS messages, flags risky spam messages, warns about overspending, and recommends simple investing actions such as SIPs.

## Features

- SMS parser for debit, credit, UPI, card, wallet, and ATM-style messages.
- Danger tagging for spam, phishing, OTP theft, KYC, blocked-account, prize, and suspicious-link messages.
- Budget and savings-goal setup with monthly budget adjustments.
- Reward rule: staying under budget grants points and can increase next month's budget.
- Penalty rule: overspending deducts from next month's budget.
- Smart alerts for burn rate, suspicious SMS, and savings shortfall.
- SIP and investing suggestions based on monthly surplus.
- Local-first prototype: all data is stored in browser local storage.

## Run

Open `index.html` in a browser.

No build step or server is required.

## Demo Flow

1. Review the seeded SMS inbox and parsed transactions.
2. Paste a new bank or UPI SMS into the SMS scanner.
3. Adjust the monthly budget and savings goal.
4. Use "Apply Month-End Rule" to calculate rewards or penalties.
5. Review SIP and safety recommendations.

## Notes

This project is a hackathon-friendly prototype. A production mobile version would need explicit Android SMS permissions, secure on-device processing, clear consent screens, and privacy-preserving storage.
