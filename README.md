# DeadManVault

[![Tally Verified](https://tallyarc.tech/api/badge/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55?chain=bot)](https://tallyarc.tech/c/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55?chain=bot)
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

## 2. Deployments & Provenance

| Network | Chain ID | Native Coin | Contract Address | Tally Status |
| :--- | :---: | :---: | :--- | :---: |
| **BOT Chain** | `677` | BOT | [`0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55`](https://scan.botchain.ai/address/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55) | **Tally Verified** 🟢 |

* **Live Tally Record:** [https://tallyarc.tech/c/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55?chain=bot](https://tallyarc.tech/c/0xE81DE339f66E9c5eaCF9B19f93A8Ba1c62ecdF55?chain=bot)
* **Registration Tx:** [`0x61b3663b7330f0b2e59db82400c415716ae124edc156f969f88586e4e6d72159`](https://scan.botchain.ai/tx/0x61b3663b7330f0b2e59db82400c415716ae124edc156f969f88586e4e6d72159)
* **Verified Owner / Signer:** `0x71198ce91fe39a21e112Ce251750b4d765bc033D`

---

## 3. Architecture

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

## 4. Specifications

* **Solidity Version:** `0.8.24`
* **EVM Target:** `paris`
* **Network:** BOT Chain (Chain ID `677`)
* **RPC Endpoint:** `https://rpc.botchain.ai`

---

## 5. Tally Provenance & Verification

* **Status:** **Tally Verified** 🟢
* **Control:** Proven on-chain via `owner` role held by `0x71198ce91fe39a21e112Ce251750b4d765bc033D`.
* **Code:** Bytecode matches the source repository; non-upgradeable.
* **Source:** Listed in root [`tally.json`](./tally.json) on the default branch (`main`).

---

## 6. License

MIT License. See [LICENSE](LICENSE) for details.
