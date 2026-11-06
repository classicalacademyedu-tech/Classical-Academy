
/* =====================================
   CLASSICAL ACADEMY - SUPABASE
===================================== */

const SUPABASE_URL = "https://fskfjvyetjuofappxqnw.supabase.co";

const SUPABASE_KEY = "sb_publishable_m07iz_JW12ynejlP3hXVJQ_wzuXq_4X";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =====================================
   REGISTRATION
===================================== */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const classLevel = document.getElementById("classLevel");
  const groupBox = document.getElementById("groupBox");
  const studentGroup = document.getElementById("studentGroup");

  classLevel.addEventListener("change", () => {
    const needsGroup = ["9", "10"].includes(classLevel.value);
    groupBox.classList.toggle("hidden", !needsGroup);
    studentGroup.required = needsGroup;

    if (!needsGroup) studentGroup.value = "";
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("message");
    const button = document.getElementById("registerBtn");

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const selectedClass = classLevel.value;
    const group = studentGroup.value;

    message.style.color = "#d32f2f";

    if (username.length < 3) {
      message.textContent = "Username কমপক্ষে ৩ অক্ষরের হতে হবে।";
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      message.textContent = "Username-এ শুধু English letters, numbers ও underscore ব্যবহার করো।";
      return;
    }

    if (password.length < 8) {
      message.textContent = "Password কমপক্ষে ৮ অক্ষরের হতে হবে।";
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "দুটি Password মিলছে না।";
      return;
    }

    if (["9", "10"].includes(selectedClass) && !group) {
      message.textContent = "তোমার Group নির্বাচন করো।";
      return;
    }

    button.disabled = true;
    button.textContent = "Creating Account...";
    message.textContent = "";

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/login.html",
          data: {
            full_name: fullName,
            username: username,
            phone: phone,
            class_level: selectedClass,
            student_group: group || null
          }
        }
      });

      if (error) throw error;

      message.style.color = "green";

      if (data.session) {
        message.textContent =
          "Account তৈরি হয়েছে! এখন Login করতে পারো।";

        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        message.textContent =
          "Registration সফল! তোমার Email Inbox খুলে Verification Link-এ ক্লিক করো।";
      }

      registerForm.reset();
      groupBox.classList.add("hidden");
      studentGroup.required = false;

    } catch (error) {
      message.textContent = error.message || "Registration ব্যর্থ হয়েছে।";
    } finally {
      button.disabled = false;
      button.textContent = "Create Account";
    }
  });
}

/* =====================================
   LOGIN
===================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = document.getElementById("loginMessage");
    const button = document.getElementById("loginBtn");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    button.disabled = true;
    button.textContent = "Logging in...";
    message.style.color = "#d32f2f";

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      message.style.color = "green";
      message.textContent = "Login সফল!";

      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError) throw profileError;

      setTimeout(() => {
        if (profile.role === "superadmin" || profile.role === "admin") {
          window.location.href = "admin/admin.html";
        } else {
          window.location.href = "index.html";
        }
      }, 800);

    } catch (error) {
      message.textContent = error.message || "Login ব্যর্থ হয়েছে।";
    } finally {
      button.disabled = false;
      button.textContent = "Login";
    }
  });

  /* Forgot password */

  document.getElementById("forgotPassword")
    .addEventListener("click", async (event) => {
      event.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const message = document.getElementById("loginMessage");

      if (!email) {
        message.textContent = "প্রথমে Email Address লিখো।";
        return;
      }

      try {
        const { error } =
          await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/login.html"
          });

        if (error) throw error;

        message.style.color = "green";
        message.textContent =
          "Password reset link তোমার Email-এ পাঠানো হয়েছে।";

      } catch (error) {
        message.style.color = "#d32f2f";
        message.textContent = error.message;
      }
    });
}
