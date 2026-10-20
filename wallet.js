
async function loadWallet() {
  const balanceBox = document.getElementById("walletBalance");
  const statusBox = document.getElementById("walletStatus");
  const historyBox = document.getElementById("walletHistory");

  if (!balanceBox || !statusBox || !historyBox) return;

  const client = window.supabaseClient;

  if (!client) {
    balanceBox.textContent = "Unavailable";
    statusBox.textContent = "Wallet connection is not ready.";
    return;
  }

  balanceBox.textContent = "Loading...";
  statusBox.textContent = "";

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError || !sessionData.session) {
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

    statusBox.textContent =
      "Your displayed balance uses approved wallet transactions.";

    const { data: transactions, error: historyError } = await client
      .from("wallet_transactions")
      .select("type, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    historyBox.replaceChildren();

    if (historyError) {
      const message = document.createElement("p");
      message.textContent = "Transaction history is unavailable.";
      historyBox.appendChild(message);
      return;
    }

    if (!transactions || transactions.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No transactions yet.";
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
        " | Status: " + String(transaction.status || "Unknown");

      item.append(title, details);
      historyBox.appendChild(item);
    });
  } catch (error) {
    console.error("Wallet loading error:", error);
    balanceBox.textContent = "Unavailable";
    statusBox.textContent =
      "Could not load wallet. Please check your database setup.";
  }
}

window.loadWallet = loadWallet;

async function submitWithdrawal(event) {
  event.preventDefault();

  const form = document.getElementById("withdrawalForm");
  const statusBox = document.getElementById("withdrawalStatus");
  const submitButton = document.getElementById("withdrawalSubmitButton");

  if (!form || !statusBox || !submitButton) return;

  const client = window.supabaseClient;

  if (!client) {
    statusBox.textContent = "Wallet connection is not ready.";
    return;
  }

  const method = document.getElementById("withdrawalMethod").value;
  const accountName = document.getElementById("withdrawalName").value.trim();
  const accountNumber = document.getElementById("withdrawalNumber").value.trim();
  const amount = Number(document.getElementById("withdrawalAmount").value);

  if (!["Easypaisa", "JazzCash"].includes(method)) {
    statusBox.textContent = "Please choose Easypaisa or JazzCash.";
    return;
  }

  if (!accountName || accountName.length > 100) {
    statusBox.textContent = "Please enter a valid account holder name.";
    return;
  }

  if (!/^[0-9+\-\s]{10,20}$/.test(accountNumber)) {
    statusBox.textContent = "Please enter a valid mobile account number.";
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    statusBox.textContent = "Please enter a valid withdrawal amount.";
    return;
  }

  submitButton.disabled = true;
  statusBox.textContent = "Submitting your request...";

  try {
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData.session;

    if (!session) {
      statusBox.textContent = "Please log in before requesting a withdrawal.";
      return;
    }

    const { data: wallet, error: walletError } = await client
      .from("my_wallet_summary")
      .select("balance")
      .maybeSingle();

    if (walletError) throw walletError;

    const balance = Number(wallet?.balance ?? 0);

    if (amount > balance) {
      statusBox.textContent =
        "Your requested amount is greater than your displayed balance.";
      return;
    }

    const { error: insertError } = await client
      .from("withdrawal_requests")
      .insert({
        user_id: session.user.id,
        method: method,
        account_name: accountName,
        account_number: accountNumber,
        amount: amount
      });

    if (insertError) throw insertError;

    statusBox.textContent =
      "Withdrawal request submitted successfully. It is pending review; no payment has been sent yet.";

    form.reset();
  } catch (error) {
    console.error("Withdrawal submission error:", error);
    statusBox.textContent =
      "Request could not be submitted. Please check your login and database permissions, then try again.";
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
