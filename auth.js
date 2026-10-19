
const supabaseClient = window.supabase.createClient(
  "https://csbkmcilckylwjmkyhmi.supabase.co",
  "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
);

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Signup submitted! Check your email if confirmation is required.");
}

async function logIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Login successful!");
}
