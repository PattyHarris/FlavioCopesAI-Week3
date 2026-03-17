export function allocateEvenly(totalCents, userIds) {
  const count = userIds.length;
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return userIds.map((userId, index) => ({
    user_id: userId,
    amount_cents: base + (index < remainder ? 1 : 0),
  }));
}

export function createSplits({ splitType, totalCents, selectedUserIds, exactAmountsByUser }) {
  if (!selectedUserIds.length) {
    throw new Error("Select at least one member for the split.");
  }

  if (splitType === "equal") {
    return allocateEvenly(totalCents, selectedUserIds);
  }

  const splits = selectedUserIds.map((userId) => ({
    user_id: userId,
    amount_cents: Number(exactAmountsByUser[userId] || 0),
  }));

  const exactTotal = splits.reduce((sum, item) => sum + item.amount_cents, 0);

  if (exactTotal !== totalCents) {
    throw new Error("Exact split amounts must add up to the full expense amount.");
  }

  return splits;
}

export function calculateMemberBalances(members, expenses, splits, settlements) {
  const netByUser = Object.fromEntries(members.map((member) => [member.user_id, 0]));

  expenses.forEach((expense) => {
    netByUser[expense.paid_by] = (netByUser[expense.paid_by] || 0) + expense.amount_cents;
  });

  splits.forEach((split) => {
    netByUser[split.user_id] = (netByUser[split.user_id] || 0) - split.amount_cents;
  });

  settlements.forEach((settlement) => {
    netByUser[settlement.payer_id] = (netByUser[settlement.payer_id] || 0) + settlement.amount_cents;
    netByUser[settlement.payee_id] = (netByUser[settlement.payee_id] || 0) - settlement.amount_cents;
  });

  return members.map((member) => ({
    ...member,
    balance_cents: netByUser[member.user_id] || 0,
  }));
}

export function simplifyBalances(memberBalances) {
  const creditors = memberBalances
    .filter((member) => member.balance_cents > 0)
    .map((member) => ({ ...member }));
  const debtors = memberBalances
    .filter((member) => member.balance_cents < 0)
    .map((member) => ({ ...member, balance_cents: Math.abs(member.balance_cents) }));

  const transfers = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = Math.min(creditor.balance_cents, debtor.balance_cents);

    transfers.push({
      from: debtor,
      to: creditor,
      amount_cents: amount,
    });

    creditor.balance_cents -= amount;
    debtor.balance_cents -= amount;

    if (creditor.balance_cents === 0) {
      creditorIndex += 1;
    }

    if (debtor.balance_cents === 0) {
      debtorIndex += 1;
    }
  }

  return transfers;
}
