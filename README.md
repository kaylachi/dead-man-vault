# DeadManVault

[![Tally Provenance](https://tallyarc.tech/api/badge/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55?chain=bot)](https://tallyarc.tech/c/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55?chain=bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)

> **"Know the code before you sign. Proof completes the record."**

A decentralized digital asset inheritance and dead-man's switch smart contract on **BOT Chain**, verified under **Tally** provenance standards.

---

## 1. Overview

**DeadManVault** provides an automated, trustless inheritance safety net for digital assets:
* **Heartbeat Mechanism:** The owner confirms activity by sending a `checkIn()` transaction (or depositing funds).
* **Inactivity Countdown:** Configurable inactivity duration (e.g. 90 or 180 days).
* **Beneficiary Execution:** If the countdown reaches zero without an owner check-in, the designated `beneficiary` can call `claimInheritance()` to transfer the entire balance.
* **Owner Sovereignty:** The owner maintains full ownership, can change the beneficiary, adjust the timeout, or withdraw funds at any time while active.
* **Tally Provenance:** Control is proven via `owner` state variable on-chain, linked immutably to this public repository.

---

## 2. Architecture

```
                    +-----------------------------+
                    |         Vault Owner         |
                    | - Deposits funds            |
                    | - Calls checkIn()           |
                    | - Updates beneficiary       |
                    +--------------+--------------+
                                   | Heartbeat / Admin
                                   v
+---------------------------------------------------------------+
|                         DeadManVault                          |
|                                                               |
|  - Storage: owner, beneficiary, inactivityTimeout, lastCheckIn|
|  - Logic: (block.timestamp - lastCheckIn) >= inactivityTimeout|
+---------------------------------------------------------------+
                                   ^
                                   | claimInheritance()
                    +--------------+--------------+
                    |         Beneficiary         |
                    | - Receives assets after     |
                    |   inactivity threshold      |
                    +-----------------------------+
```

---

## 3. Specifications

* **Solidity Version:** `0.8.24`
* **EVM Target:** `paris`
* **Network:** BOT Chain (Chain ID `677`)
* **RPC Endpoint:** `https://rpc.botchain.ai`

---

## 4. Tally Provenance & Verification

* **Status:** Verified 🟢
* **Control:** Proven on-chain via `owner` contract role.
* **Code:** Bytecode matches the source repository.
* **Source:** Listed in root [`tally.json`](./tally.json).

---

## 5. License

MIT License. See [LICENSE](LICENSE) for details.
