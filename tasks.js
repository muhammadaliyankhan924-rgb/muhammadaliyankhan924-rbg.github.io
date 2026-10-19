
async function loadTasks() {
  const list = document.getElementById("taskList");

  if (!list || !window.supabaseClient) return;

  const { data, error } = await window.supabaseClient
    .from("tasks")
    .select("id, title, description, reward")
    .eq("is_active", true);

  if (error) {
    list.textContent = "Tasks load nahi ho sake. Please try again.";
    console.error(error.message);
    return;
  }

  list.replaceChildren();

  if (!data || data.length === 0) {
    list.textContent = "Abhi koi task available nahi hai.";
    return;
  }

  data.forEach(task => {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const description = document.createElement("p");
    const reward = document.createElement("p");

    title.textContent = task.title;
    description.textContent = task.description;
    reward.textContent = "Reward: PKR " + Number(task.reward).toFixed(2);

    card.append(title, description, reward);
    list.appendChild(card);
  });
}
