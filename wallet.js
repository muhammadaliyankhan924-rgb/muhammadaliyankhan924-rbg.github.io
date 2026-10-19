
async function loadWallet() {
  const balanceBox = document.getElementById("walletBalance");
  const statusBox = document.getElementById("walletStatus");
  const historyBox = document.getElementById("walletHistory");

  if (!balanceBox || !statusBox || !historyBox) return;

  balanceBox.textContent = "Loading...";
  statusBox.textContent = "";

  const client = window.supabaseClient;

  if (!client) {
    balanceBox.textContent = "Unavailable";
    statusBox.textContent = "Wallet connection is not ready.";
    return;
  }

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

  if (error) {
    balanceBox.textContent = "Unavailable";
    statusBox.textContent =
      "Could not load wallet. Please check the database setup.";
    console.error(error.message);
    return;
  }

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
    title.textContent = transaction.type.replaceAll("_", " ");

    const details = document.createElement("p");
    details.textContent =
      "Amount: PKR " + Number(transaction.amount).toFixed(2) +
      " | Status: " + transaction.status;

    item.append(title, details);
    historyBox.appendChild(item);
  });
}

document.addEventListener("DOMContentLoaded", loadWallet);

window.addEventListener("technova-auth-changed", loadWallet);
