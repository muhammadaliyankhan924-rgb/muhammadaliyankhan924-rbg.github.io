
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
    console.error(error.message);
    list.textContent = "Tasks could not load. Please try again.";
    return;
  }

  list.replaceChildren();

  if (!tasks || tasks.length === 0) {
    list.textContent = "No tasks available right now.";
    return;
  }

  tasks.forEach(task => {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const reward = document.createElement("p");
    const question = document.createElement("p");
    const answer = document.createElement("input");
    const button = document.createElement("button");
    const status = document.createElement("p");

    title.textContent = task.title;
    description.textContent = task.description;
    reward.textContent =
      "Reward: PKR " + Number(task.reward).toFixed(2);

    if (Number(task.id) === 1) {
      question.textContent =
        "Question: What should you do before sharing personal information online?";
      answer.placeholder = "Type your answer";
    } else {
      question.textContent =
        "Complete the task instructions, then submit your answer for review.";
      answer.placeholder = "Enter your answer";
    }

    answer.type = "text";
    answer.maxLength = 500;
    answer.style.cssText =
      "width:100%;padding:10px;box-sizing:border-box;";

    button.type = "button";
    button.textContent = "Check Answer";
    button.style.cssText =
      "margin-top:10px;padding:10px 18px;cursor:pointer;";

    status.setAttribute("role", "status");

    button.addEventListener("click", async () => {
      const client = window.supabaseClient;
      const submittedAnswer = answer.value.trim();

      if (!submittedAnswer) {
        status.textContent = "Please enter your answer.";
        return;
      }

      const { data: sessionData, error: sessionError } =
        await client.auth.getSession();

      if (sessionError || !sessionData.session) {
        status.textContent =
          "Please log in before checking your answer.";
        return;
      }

      if (Number(task.id) !== 1) {
        status.textContent =
          "This task's answer verification is not set up yet.";
        return;
      }

      button.disabled = true;
      status.textContent = "Checking your answer...";

      try {
        const { data, error } = await client.rpc(
          "verify_welcome_task",
          { submitted_answer: submittedAnswer }
        );

        if (error) {
          console.error(error.message);
          status.textContent =
            "Verification failed. Please try again.";
          return;
        }

        status.textContent = data === true
          ? "Correct answer! Verification passed."
          : "Not quite right. Please review the task and try again.";
      } catch (err) {
        console.error(err);
        status.textContent = "Something went wrong. Please try again.";
      } finally {
        button.disabled = false;
      }
    });

    card.append(
      title, description, reward, question,
      answer, button, status
    );

    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadTasks);
