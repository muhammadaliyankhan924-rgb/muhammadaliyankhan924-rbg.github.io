
async function loadWallet() {
  const balanceBox = document.getElementById("walletBalance");
  const statusBox = document.getElementById("walletStatus");
  const historyBox = document.getElementById("walletHistory");
  const client = window.supabaseClient;

  if (!balanceBox || !statusBox || !historyBox) return;

  if (!client) {
    balanceBox.textContent = "Unavailable";
    statusBox.textContent = "Wallet connection is not ready.";
    return;
  }

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      balanceBox.textContent = "PKR 0.00";
      statusBox.textContent = "Please log in to view your wallet.";
      historyBox.replaceChildren();
      return;
    }

    const { data, error } = await client
      .from("my_wallet_summary")
      .select("balance")
      .maybeSingle();

    if (error) throw error;

    balanceBox.textContent =
      "PKR " + Number(data?.balance ?? 0).toFixed(2);

    statusBox.textContent = "Your wallet balance.";

    const { data: transactions, error: historyError } = await client
      .from("wallet_transactions")
      .select("type, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    historyBox.replaceChildren();

    if (historyError) {
      historyBox.textContent = "Transaction history is unavailable.";
      return;
    }

    if (!transactions?.length) {
      historyBox.textContent = "No transactions yet.";
      return;
    }

    transactions.forEach(transaction => {
      const item = document.createElement("article");
      item.className = "task-card";

      const title = document.createElement("h3");
      title.textContent = String(transaction.type || "Transaction")
        .replaceAll("_", " ");

      const details = document.createElement("p");
      details.textContent =
        "Amount: PKR " +
        Number(transaction.amount).toFixed(2) +
        " | Status: " + String(transaction.status || "Unknown");

      item.append(title, details);
      historyBox.appendChild(item);
    });
  } catch (error) {
    console.error("Wallet loading error:", error);
    balanceBox.textContent = "Unavailable";
    statusBox.textContent = "Could not load wallet.";
  }
}

window.loadWallet = loadWallet;

async function submitWithdrawal(event) {
  event.preventDefault();

  const form = document.getElementById("withdrawalForm");
  const statusBox = document.getElementById("withdrawalStatus");
  const submitButton = document.getElementById("withdrawalSubmitButton");
  const client = window.supabaseClient;

  if (!form || !statusBox || !submitButton || !client) return;

  const method = document.getElementById("withdrawalMethod").value;
  const accountName =
    document.getElementById("withdrawalName").value.trim();
  const accountNumber =
    document.getElementById("withdrawalNumber").value.trim();
  const amount =
    Number(document.getElementById("withdrawalAmount").value);

  if (!["Easypaisa", "JazzCash"].includes(method)) {
    statusBox.textContent = "Choose Easypaisa or JazzCash.";
    return;
  }

  if (!accountName || accountName.length > 100) {
    statusBox.textContent = "Enter a valid account holder name.";
    return;
  }

  if (!/^[0-9+\-\s]{10,20}$/.test(accountNumber)) {
    statusBox.textContent = "Enter a valid mobile account number.";
    return;
  }

  if (!Number.isFinite(amount) || amount < 500 || amount > 10000) {
    statusBox.textContent =
      "Minimum withdrawal is PKR 500 and maximum is PKR 10,000.";
    return;
  }

  submitButton.disabled = true;
  statusBox.textContent = "Submitting your withdrawal request...";

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData.session;

    if (!session) {
      statusBox.textContent = "Please log in first.";
      return;
    }

    const { data: wallet, error: walletError } = await client
      .from("my_wallet_summary")
      .select("balance")
      .maybeSingle();

    if (walletError) throw walletError;

    if (amount > Number(wallet?.balance ?? 0)) {
      statusBox.textContent = "Insufficient wallet balance.";
      return;
    }

    const { error: insertError } = await client
      .from("withdrawal_requests")
      .insert({
        user_id: session.user.id,
        method,
        account_name: accountName,
        account_number: accountNumber,
        amount
      });

    if (insertError) throw insertError;

    form.reset();
    statusBox.textContent = "Request received. Please wait 5 seconds...";

    await new Promise(resolve => setTimeout(resolve, 5000));

    statusBox.textContent =
      "Withdrawal Is Under Review. Your request has been received. " +
      "Payment is targeted within 24 hours after review.";

    await loadWallet();
  } catch (error) {
    console.error("Withdrawal submission error:", error);
    statusBox.textContent =
      error.message || "Withdrawal request failed. Please try again.";
  } finally {
    submitButton.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadWallet();

  const form = document.getElementById("withdrawalForm");

  if (form) {
    form.addEventListener("submit", submitWithdrawal);
  }
});

window.addEventListener("technova-auth-changed", loadWallet);
