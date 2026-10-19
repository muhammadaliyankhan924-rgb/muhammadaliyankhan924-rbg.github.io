
const supabaseClient = window.supabase.createClient(
  "https://csbkmcilckylwjmkyhmi.supabase.co",
  "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
);

const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const statusBox = document.getElementById("authStatus");
const signupButton = document.getElementById("signupButton");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");

function showStatus(message) {
  statusBox.textContent = message;
}

signupButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || password.length < 6) {
    showStatus("Enter a valid email and password of at least 6 characters.");
    return;
  }

  showStatus("Creating account...");

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    showStatus(error.message);
    return;
  }

  showStatus("Signup submitted. Check your email if confirmation is required.");
});

loginButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showStatus("Enter your email and password.");
    return;
  }

  showStatus("Logging in...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showStatus(error.message);
    return;
  }

  showStatus("Login successful!");
  logoutButton.hidden = false;
});

logoutButton.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showStatus(error.message);
    return;
  }

  showStatus("You have logged out.");
  logoutButton.hidden = true;
});

supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    showStatus("You are logged in.");
    logoutButton.hidden = false;
  }
});
