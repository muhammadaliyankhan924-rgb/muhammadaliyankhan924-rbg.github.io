
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

    claimButton.type = "button";
    claimButton.textContent = "Claim Reward";

    status.setAttribute("role", "status");

    verifyButton.addEventListener("click", async () => {
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError || !sessionData.session) {
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
          "verify_welcome_task",
          { submitted_answer: answer.value.trim() }
        );

        if (error) throw error;

        if (data !== true) {
          status.textContent =
            "Incorrect answer. Please review the task and try again.";
          return;
        }

        status.textContent =
          "Answer verified. You can now claim your reward.";
      } catch (err) {
        console.error(err);
        status.textContent =
          err.message || "Verification failed. Please try again.";
      } finally {
        verifyButton.disabled = false;
      }
    });

    claimButton.addEventListener("click", async () => {
      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError || !sessionData.session) {
        status.textContent = "Please log in first.";
        return;
      }

      claimButton.disabled = true;
      status.textContent = "Claiming reward...";

      try {
        const { data, error } = await client.rpc(
          "claim_verified_task_reward",
          { p_task_id: Number(task.id) }
        );

        if (error) throw error;

        status.textContent = data;

        const refreshWalletButton =
          document.getElementById("refreshWalletButton");

        if (refreshWalletButton) {
          refreshWalletButton.click();
        }
      } catch (err) {
        console.error(err);
        status.textContent =
          err.message || "Reward claim failed. Please try again.";
      } finally {
        claimButton.disabled = false;
      }
    });

    card.append(
      title,
      description,
      reward,
      answer,
      verifyButton,
      claimButton,
      status
    );

    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadTasks);
