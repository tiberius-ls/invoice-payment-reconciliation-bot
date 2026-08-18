# Invoice & Payment Reconciliation Bot

An automation that tracks unpaid invoices, verifies real payments, alerts you daily, and automatically reminds overdue clients — all running hands-off, at zero cost.

## The Problem

Freelancers and small businesses lose money not because clients refuse to pay, but because nobody's tracking who owes what and chasing it consistently. Invoices get forgotten in the noise of running a business, and by the time someone remembers to follow up, it's been weeks.

## The Solution

This system automatically:
1. Tracks invoices in a Google Sheet (client, amount, due date, status)
2. Calculates days overdue for every unpaid invoice
3. Sends a daily Telegram summary of what's overdue — or confirms "all clear" if nothing is, so you always know the automation is alive
4. Creates a real payment link per invoice via Paystack, and checks daily whether it's actually been paid — auto-updating the Status when it is
5. Automatically sends a WhatsApp reminder to overdue clients, so follow-up doesn't depend on you remembering
6. Reports errors immediately via Telegram if anything in the pipeline fails, instead of failing silently

## Architecture

**Flow:** Google Sheet (invoice data) → Apps Script (scheduled daily) → Paystack (payment verification) → Telegram (internal alerts) → Green API/WhatsApp (client reminders)

Two daily triggers run independently:
- **Payment verification** (runs first) — checks all unpaid invoices with a Paystack reference, updates Status if paid
- **Overdue alert** (runs after) — summarizes what's still outstanding, using freshly-verified data

## Tech Stack

| Component | Tool | Why |
|---|---|---|
| Invoice tracking | Google Sheets | Free, familiar, easy to extend |
| Automation engine | Google Apps Script | Free, natively integrated with Sheets, no separate hosting needed |
| Payment processing | Paystack (test/sandbox mode) | Real payment verification logic without real transactions |
| Internal alerts | Telegram Bot API | Free, instant, reliable delivery |
| Client reminders | Green API (WhatsApp) | Free-tier WhatsApp automation, reused from Project 1 |

**Total cost: $0.** Same constraint as Project 1 — every tool here is free-tier, proving small businesses don't need a software budget to automate real financial workflows.

## Demo

[Link to demo video]

Shows the full loop: an overdue invoice triggers a Telegram alert, a Paystack test payment gets verified and updates the sheet automatically, and an overdue client receives an automated WhatsApp reminder.

## Setup

1. Create a Google Sheet named `Invoice Tracker` with columns: Client Name, Invoice Amount, Due Date, Status, Days Overdue, Paystack Reference, Payment Link, Client Phone
2. Add the "Days Overdue" formula to column E: `=IF(D2="Unpaid", TODAY()-C2, 0)`
3. Open Extensions → Apps Script from within the Sheet (this auto-binds the script to your sheet)
4. Paste in `invoice-reconciliation.gs`
5. Replace all placeholder values (`YOUR_GOOGLE_SHEET_ID`, `YOUR_TELEGRAM_BOT_TOKEN`, `YOUR_TELEGRAM_CHAT_ID`, `YOUR_PAYSTACK_TEST_SECRET_KEY`, `YOUR_GREEN_API_INSTANCE_ID`, `YOUR_GREEN_API_TOKEN`) with your real credentials
6. Set up two time-based triggers: `verifyAllPayments` (e.g. 7–8am) and `checkOverdueInvoices` (e.g. 8–9am)
7. Create a Telegram bot via BotFather and get your Chat ID via the `/getUpdates` endpoint
8. Create a free Paystack account and get your Test Secret Key
9. Set up a Green API instance and link it via QR code (see Project 1's README for detailed steps)

## Known Limitations & Next Steps

- **No lead/invoice deduplication logic beyond reference checking** — the system prevents duplicate Paystack references per row, but doesn't yet merge or flag duplicate client entries across rows.
- **Single hardcoded test email** (`test@example.com`) is used for all Paystack transactions — a production version would pull real client emails from the sheet.
- **Unofficial WhatsApp API constraint, demonstrated in practice**: during development, the free-tier Green API instance hit its monthly message quota from testing volume, causing silent delivery failures until diagnosed. This is a real, hit constraint — not a hypothetical one — and confirms that a production deployment at real client volume would need either Green API's paid tier or Meta's official WhatsApp Cloud API.
- **No retry logic** on failed API calls beyond catching and reporting the error — a production version would attempt a retry before giving up.

## A Real Bug, Caught and Fixed

Worth noting honestly: during testing, an early version of the "Days Overdue" formula had a copy-paste row-reference error (row 3 was referencing row 2's cells), which silently produced incorrect data. It was caught by manually verifying formula outputs against expected values rather than assuming a copied formula was correct — a habit worth having in any spreadsheet-driven system.

## Author

Built by Chukwuemeka Ogbonna ([@Emeka_builds](https://twitter.com/Emeka_builds)) as part of a 5-project automation portfolio sprint, combining AI automation development with a clinical/health-tech background.
