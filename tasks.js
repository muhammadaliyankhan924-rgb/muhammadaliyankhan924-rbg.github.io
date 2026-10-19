
async function loadTasks() {
  const list = document.getElementById("taskList");

  if (!list || !window.supabaseClient) {
    if (list) list.textContent = "Tasks system is not ready.";
    return;
  }

  list.textContent = "Loading tasks...";

  const { data: tasks, error } = await window.supabaseClient
    .from("tasks")
    .select("id, title, description, reward")
    .eq("is_active", true)
    .order("id");

  if (error) {
    list.textContent = "Tasks could not load. Please try again.";
    console.error(error.message);
    return;
  }

  list.replaceChildren();

  if (!tasks || tasks.length === 0) {
    list.textContent = "No tasks available right now.";
    return;
  }

  for (const task of tasks) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const reward = document.createElement("p");
    const proof = document.createElement("textarea");
    const button = document.createElement("button");
    const status = document.createElement("p");

    title.textContent = task.title;
    description.textContent = task.description;
    reward.textContent =
      "Reward: PKR " + Number(task.reward).toFixed(2);

    proof.placeholder = "Enter your answer or proof here";
    proof.maxLength = 2000;
    proof.setAttribute("aria-label", "Proof for " + task.title);
    proof.style.cssText =
      "width:100%;min-height:90px;padding:10px;box-sizing:border-box;";

    button.type = "button";
    button.textContent = "Submit Task";
    button.style.cssText =
      "margin-top:10px;padding:10px 18px;cursor:pointer;";

    status.setAttribute("role", "status");

    button.addEventListener("click", async () => {
      const client = window.supabaseClient;

      if (!client) {
        status.textContent = "Database connection is unavailable.";
        return;
      }

      const answer = proof.value.trim();

      if (!answer) {
        status.textContent = "Please enter your proof first.";
        return;
      }

      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError || !sessionData.session) {
        status.textContent =
          "Please log in using the account section above, then try again.";
        return;
      }

      button.disabled = true;
      status.textContent = "Submitting...";

      try {
        const { error: submitError } = await client
          .from("task_submissions")
          .insert({
            user_id: sessionData.session.user.id,
            task_id: task.id,
            proof: answer
          });

        if (submitError) {
          console.error(submitError.message);
          status.textContent =
            "Submission failed. Please try again or contact support.";
          return;
        }

        status.textContent = "Submitted successfully for review!";
        proof.value = "";
      } catch (err) {
        console.error(err);
        status.textContent = "Something went wrong. Please try again.";
      } finally {
        button.disabled = false;
      }
    });

    card.append(title, description, reward, proof, button, status);
    list.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", loadTasks);
