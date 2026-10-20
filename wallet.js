
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

    const { data: wallet, error: walletError } = await client
      .from("my_wallet_summary")
      .select("balance")
      .maybeSingle();

    if (walletError) throw walletError;

    balanceBox.textContent =
      "PKR " + Number(wallet?.balance ?? 0).toFixed(2);

    statusBox.textContent = "Your wallet balance is updated.";

    const { data: transactions, error: historyError } = await client
      .from("wallet_transactions")
      .select("type, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    historyBox.replaceChildren();

    if (historyError || !transactions?.length) {
      const message = document.createElement("p");
      message.textContent = historyError
        ? "Transaction history is unavailable."
        : "No transactions yet.";
      historyBox.appendChild(message);
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
        " | Status: " +
        String(transaction.status || "Unknown");

      item.append(title, details);
      historyBox.appendChild(item);
    });
  } catch (error) {
    console.error("Wallet loading error:", error);
    balanceBox.textContent = "Unavailable";
    statusBox.textContent = "Could not load wallet.";
  }
}

async function submitWithdrawal(event) {
  event.preventDefault();

  const form = document.getElementById("withdrawalForm");
  const statusBox = document.getElementById("withdrawalStatus");
  const submitButton = document.getElementById("withdrawalSubmitButton");
  const client = window.supabaseClient;

  if (!form || !statusBox || !submitButton || !client) return;

  const method = document.getElementById("withdrawalMethod").value;
  const accountName = document.getElementById("withdrawalName").value.trim();
  const accountNumber = document.getElementById("withdrawalNumber").value.trim();
  const amount = Number(
    document.getElementById("withdrawalAmount").value
  );

  if (!["Easypaisa", "JazzCash"].includes(method)) {
    statusBox.textContent = "Choose Easypaisa or JazzCash.";
    return;
  }

  if (!accountName || accountName.length > 100) {
    statusBox.textContent = "Enter a valid account name.";
    return;
  }

  if (!/^[0-9+\-\s]{10,20}$/.test(accountNumber)) {
    statusBox.textContent = "Enter a valid account number.";
    return;
  }

  if (!Number.isFinite(amount) || amount < 500 || amount > 10000) {
    statusBox.textContent = "Withdrawal must be PKR 500–10,000.";
    return;
  }

  submitButton.disabled = true;
  statusBox.textContent = "Processing your withdrawal...";

  const startTime = Date.now();

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    if (!sessionData.session) {
      throw new Error("Please log in before requesting a withdrawal.");
    }

    const { data, error } = await client.rpc("submit_withdrawal", {
      p_method: method,
      p_account_name: accountName,
      p_account_number: accountNumber,
      p_amount: amount
    });

    if (error) throw error;

    const remaining = Math.max(0, 5000 - (Date.now() - startTime));
    await new Promise(resolve => setTimeout(resolve, remaining));

    statusBox.textContent = data || "Withdrawal Is Under Review";

    form.reset();
    await loadWallet();
  } catch (error) {
    console.error("Withdrawal error:", error);

    const remaining = Math.max(0, 5000 - (Date.now() - startTime));
    await new Promise(resolve => setTimeout(resolve, remaining));

    statusBox.textContent =
      error.message || "Withdrawal request failed.";
  } finally {
    submitButton.disabled = false;
  }
}

window.loadWallet = loadWallet;

document.addEventListener("DOMContentLoaded", () => {
  loadWallet();

  const form = document.getElementById("withdrawalForm");

  if (form) {
    form.addEventListener("submit", submitWithdrawal);
  }
});

window.addEventListener("technova-auth-changed", loadWallet);
