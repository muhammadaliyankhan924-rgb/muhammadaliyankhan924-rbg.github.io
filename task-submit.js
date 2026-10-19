
async function submitTask(taskId, proof) {
  const client = window.supabaseClient;
  const status = document.getElementById("taskSubmitStatus");

  if (!client) {
    if (status) status.textContent = "Database connection is not ready.";
    return;
  }

  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();

  if (sessionError || !sessionData.session) {
    if (status) status.textContent = "Please log in before submitting a task.";
    return;
  }

  const cleanProof = proof.trim();

  if (!cleanProof) {
    if (status) status.textContent = "Please enter your task proof.";
    return;
  }

  if (status) status.textContent = "Submitting task...";

  const { error } = await client
    .from("task_submissions")
    .insert({
      user_id: sessionData.session.user.id,
      task_id: taskId,
      proof: cleanProof
    });

  if (error) {
    if (status) {
      status.textContent = error.code === "23505"
        ? "You have already submitted this task."
        : "Submission failed. The database may need a secure submission policy.";
    }
    console.error(error.message);
    return;
  }

  if (status) status.textContent = "Task submitted for review.";
}

window.submitTask = submitTask;
