# DMoney k6 Performance Test Suite

This repository contains an automated k6 performance testing scenario designed for the **DMoney Application Portal**.

## Project Structure
- `auth.js` - Dynamic multi-user authentication handler
- `config.js` - Target API configurations & performance thresholds
- `dmoney_test.js` - Main workload scenarios, custom metrics & checks
- `data/` - Test user credentials and token schemas

## Execution Commands

Run once without OTP variables to request codes for all accounts. The setup will stop and print the required variable names. Enter the current codes, then rerun the workload; that second run verifies the codes directly without requesting new ones.

```bash
k6 run script.js
```

```bash
export DMONEY_OTP_AGENT1=\"<agent1-code>\"
export DMONEY_OTP_AGENT2=\"<agent2-code>\"
export DMONEY_OTP_CUSTOMER1=\"<customer1-code>\"
export DMONEY_OTP_CUSTOMER2=\"<customer2-code>\"
export DMONEY_OTP_MERCHANT1=\"<merchant1-code>\"
export DMONEY_OTP_MERCHANT2=\"<merchant2-code>\"
k6 run script.js
```

Run commands from the repository root. OTPs expire, so complete the second run promptly.

If an account password differs from `users.json`, override it without editing the file. For the current `customer1` rejection:

```bash
export DMONEY_PASSWORD_CUSTOMER1='<correct-password>'
k6 run script.js
```

You can also override an account phone or email identifier with `DMONEY_PHONE_<USERKEY>`. Set the corresponding OTP variables for every account during the verification run.