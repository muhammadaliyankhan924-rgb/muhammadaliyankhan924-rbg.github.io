async function loadTasks() {
  const list = document.getElementById("taskList");
  const client = window.supabaseClient;

  if (!list || !client) {
    if (list) list.textContent = "Tasks system is not ready.";
    return;
  }

  list.textContent = "Loading tasks...";

  const { data: tasks, error } = await client
    .from("tasks")
    .select("id, title, description, reward")
    .eq("is_active", true)
    .order("id");

  if (error) {
    console.error(error);
    list.textContent = "Tasks could not load. Please try again.";
    return;
  }

  list.replaceChildren();

  if (!tasks || tasks.length === 0) {
    list.textContent = "No tasks available.";
    return;
  }

  tasks.forEach(task => {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const reward = document.createElement("p");
    const answer = document.createElement("input");
    const verifyButton = document.createElement("button");
    const codeArea = document.createElement("div");
    const codeText = document.createElement("p");
    const codeInput = document.createElement("input");
    const claimButton = document.createElement("button");
    const status = document.createElement("p");

    title.textContent = task.title;
    description.textContent = task.description;
    reward.textContent =
      "Reward: PKR " + Number(task.reward).toFixed(2);

    answer.type = "text";
    answer.placeholder = "Enter your task answer";
    answer.maxLength = 500;
    answer.style.cssText =
      "width:100%;padding:10px;box-sizing:border-box;margin:8px 0;";

    verifyButton.type = "button";
    verifyButton.textContent = "Verify Answer";

    codeArea.hidden = true;
    codeText.textContent = "Your completion code:";

    codeInput.type = "text";
    codeInput.placeholder = "Paste your completion code";
    codeInput.style.cssText =
      "width:100%;padding:10px;box-sizing:border-box;margin:8px 0;";

    claimButton.type = "button";
    claimButton.textContent = "Claim Reward";

    status.setAttribute("role", "status");

    verifyButton.addEventListener("click", async () => {
      const { data: sessionData } = await client.auth.getSession();

      if (!sessionData.session) {
        status.textContent = "Please log in first.";
        return;
      }

      if (Number(task.id) !== 1) {
        status.textContent =
          "Verification for this task is not configured yet.";
        return;
      }

      if (!answer.value.trim()) {
        status.textContent = "Please enter your answer.";
        return;
      }

      verifyButton.disabled = true;
      status.textContent = "Verifying answer...";

      try {
        const { data, error } = await client.rpc(
          "generate_completion_code",
          {
            p_task_id: Number(task.id),
            p_answer: answer.value.trim()
          }
        );

        if (error) throw error;

        codeInput.value = data;
        codeArea.hidden = false;
        status.textContent =
          "Answer verified. Copy the code and claim your reward.";
      } catch (err) {
        console.error(err);
        status.textContent =
          err.message || "Verification failed. Please try again.";
      } finally {
        verifyButton.disabled = false;
      }
    });

    claimButton.addEventListener("click", async () => {
      const { data: sessionData } = await client.auth.getSession();

      if (!sessionData.session) {
        status.textContent = "Please log in first.";
        return;
      }

      const code = codeInput.value.trim();

      if (!code) {
        status.textContent = "Enter your completion code first.";
        return;
      }

      claimButton.disabled = true;
      status.textContent = "Claiming reward...";

      try {
        const { data, error } = await client.rpc(
          "claim_task_reward",
          { p_completion_code: code }
        );

        if (error) throw error;

        status.textContent = data;
        codeArea.hidden = true;

        const walletStatus = document.getElementById("walletStatus");
        const refreshWalletButton =
          document.getElementById("refreshWalletButton");

        if (refreshWalletButton) {
          refreshWalletButton.click();
        } else if (walletStatus) {
          walletStatus.textContent =
            "Reward claimed. Refresh your wallet to see the balance.";
        }
      } catch (err) {
        console.error(err);
        status.textContent =
          err.message || "Reward claim failed. Please try again.";
      } finally {
        claimButton.disabled = false;
      }
    });

    codeArea.append(codeText, codeInput, claimButton);
    card.append(
      title,
      description,
      reward,
      answer,
      verifyButton,
      codeArea,
      status
    );

    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadTasks);
