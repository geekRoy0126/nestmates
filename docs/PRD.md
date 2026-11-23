# Nestmates — Product Requirements

CS6983 Project 3 · Ruoyu Wang & Qingyu Cheng

## Problem

Students who share an apartment split two things all year: chores and bills. Chores live on a whiteboard or in a
group chat, so one roommate quietly does most of the work and nobody can show it. Bills are paid by whoever had a
card out, some items are only for some people, and paying back turns into a chain of small transfers. Existing apps
handle money *or* chores, and none of them explain *why* a balance is what it is.

## Users and roles

| Role | Who | Can do |
| --- | --- | --- |
| Household admin | The roommate who sets the household up | Everything a roommate can, plus: invite/remove members, define chores and weights, see the fairness report |
| Roommate | Every member of the household | Log expenses, mark chores done, request swaps, mark self away, see balances and settle-up plan |

Roles are **per household**: one person can be admin of one household and a roommate in another.

## User stories and acceptance criteria

### US1 — Create household and invite (admin)
- An admin creates a household with a name; they become its first member and admin.
- The admin gets an invite link; anyone signed in who opens it joins as a roommate.
- A household has 2–8 members.

### US2 — Define weighted recurring chores (admin)
- A chore has a name, an effort weight (integer 1–5), and a frequency (weekly).
- Weights are positive integers; 0 or negative weights are rejected.

### US3 — Fair automatic chore rotation (roommate)  ← *HW4 Part 2 feature*
- Each week every chore is assigned to exactly one **available** member (members marked *away* that week are skipped).
- Assignment balances **cumulative effort points**: the chore goes to the available member with the fewest points so
  far; heavier chores are placed first.
- Ties are broken deterministically (by member join order) so the same input always gives the same schedule.
- If nobody is available, the chore is left unassigned and flagged — never silently dropped.

### US4 — Mark done / request swap (roommate)
- A member marks their own chore done; a swap needs the other member's acceptance.

### US5 — Log and split an expense (roommate)  ← *HW4 Part 3 TDD feature*
- Amounts are stored in **integer cents**; no floating-point money anywhere.
- Split modes: **even** (among all or a chosen subset), **shares** (e.g. 2:1:1), **exact** (amounts that must add up
  to the total).
- The parts of a split always add up to exactly the expense total; leftover cents from rounding go one cent at a time
  to participants in a deterministic order.
- Only household members can be participants; empty participant lists, zero/negative totals, and exact amounts that
  don't add up are rejected with a clear error.

### US6 — Explained balance (roommate)  ← *HW4 Part 3 TDD feature*
- A member's balance = what they paid − what they owe, over all expenses.
- The sum of all balances in a household is always exactly 0.
- Each balance comes with line items (expense, paid, owed) that add up to it.

### US7 — Settle up in the fewest transfers (roommate)  ← *HW4 Part 3 TDD feature*
- The plan's transfers, applied to the balances, bring every balance to exactly 0.
- A household with *n* non-zero balances never needs more than *n − 1* transfers.
- No transfer is zero, negative, or from a person to themselves.
- The plan is deterministic.

### US8 — Monthly fairness report (admin)
- Per member: effort points done, money paid, money owed, for a calendar month.

## Stretch
- Receipt/message → draft expense assistant (Claude Agent SDK) that calls the split functions as tools.
- Weekly reminder email.

## Out of scope
Real payments or bank links, lease/landlord management, native mobile apps, roommate matching.
