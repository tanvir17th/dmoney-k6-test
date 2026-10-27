# DMoney k6 Performance Test Suite

This repository contains an automated k6 performance testing scenario designed for the **DMoney Application Portal**.

## Project Structure
- `auth.js` - Dynamic multi-user authentication handler
- `config.js` - Target API configurations & performance thresholds
- `dmoney_test.js` - Main workload scenarios, custom metrics & checks
- `data/` - Test user credentials and token schemas

## Execution Commands

`script.js` reuses unexpired JWTs from `tokens.json` and stops before the load test if they have expired. Refresh tokens locally with Node 20 or newer:

```bash
node refresh_tokens.js
```

The first run requests OTPs and prints the required environment variable names. Retrieve codes through each account's normal delivery channel, then rerun the helper with the codes in the environment. The helper verifies them, checks that the returned tokens are unexpired, and updates `tokens.json` atomically without printing token values. For example:

```bash
DMONEY_OTP_AGENT1='<current-code>' \
DMONEY_OTP_AGENT2='<current-code>' \
DMONEY_OTP_CUSTOMER1='<current-code>' \
DMONEY_OTP_CUSTOMER2='<current-code>' \
DMONEY_OTP_MERCHANT1='<current-code>' \
DMONEY_OTP_MERCHANT2='<current-code>' \
node refresh_tokens.js
```

Then run the workload:

```bash
k6 run --out web-dashboard=report.html script.js
```

Tokens expire, so run the refresh helper again when needed. `setup_auth.js` is disabled because it used an admin endpoint to retrieve user OTPs; it now fails with a message directing you to the Node helper. Keep account credentials and tokens private. `.gitignore` now excludes generated tokens and reports, but `tokens.json` and `users.json` are already tracked in Git; untracking them requires removing them from the repository index and rotating any credentials/tokens already exposed.

If an OTP is rejected, request a fresh code and rerun promptly. If password login later fails, check that the corresponding credentials in `users.json` are current.

`dmoney_test.js` is a compatibility entrypoint for the same workload; `script.js` is the canonical file.