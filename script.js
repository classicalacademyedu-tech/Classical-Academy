"use strict";

// =========================================
// CLASSICAL ACADEMY - REGISTRATION
// =========================================

const SUPABASE_URL = "https://fskfjvyetjuofappxqnw.supabase.co";
const SUPABASE_KEY = "sb_publishable_m07iz_JW12ynejlP3hXVJQ_wzuXq_4X";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const PENDING_KEY = "ca_pending_signup";

function showMessage(message, success = false) {
  const box = document.getElementById("message");
  if (!box) {
    alert(message);
    return;
  }

  box.textContent = message;
  box.style.color = success ? "green" : "red";
}

// =========================================
// REGISTRATION PAGE
// =========================================

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

    const button = document.getElementById("registerBtn");

    const fullName = document.getElementById("fullName").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value.trim();
    const selectedClass = classLevel.value;
    const group = studentGroup.value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
      showMessage("Username কমপক্ষে ৩ অক্ষরের হতে হবে।");
      return;
    }

    if (!/^[0-9]{11}$/.test(phone)) {
      showMessage("সঠিক ১১ সংখ্যার Mobile Number দাও।");
      return;
    }

    if (["9", "10"].includes(selectedClass) && !group) {
      showMessage("তোমার Group নির্বাচন করো।");
      return;
    }

    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      showMessage(
        "Password-এ ৮ অক্ষর, বড় ও ছোট হাতের অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন থাকতে হবে।"
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage("দুটি Password মিলছে না।");
      return;
    }

    button.disabled = true;
    button.textContent = "OTP পাঠানো হচ্ছে...";

    try {
      // OTP request-এর জন্য প্রয়োজনীয় তথ্য সাময়িকভাবে রাখা
      const pendingData = {
        fullName,
        username,
        email,
        phone,
        classLevel: selectedClass,
        studentGroup: group || null,
        password
      };

      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify(pendingData)
      );

      const { error } = await supabaseClient.auth.signInWithOtp({
        email,

        options: {
          shouldCreateUser: true,

          data: {
            full_name: fullName,
            username,
            phone,
            class_level: selectedClass,
            student_group: group || null
          }
        }
      });

      if (error) throw error;

      // আলাদা Verification Page
      window.location.href = "verify.html";

    } catch (error) {
      console.error(error);

      sessionStorage.removeItem(PENDING_KEY);

      showMessage(
        error.message || "OTP পাঠানো যায়নি। আবার চেষ্টা করো।"
      );

      button.disabled = false;
      button.textContent = "Create Account";
    }
  });
}

// =========================================
// VERIFICATION PAGE
// =========================================

const verifyButton = document.getElementById("verifyBtn");

if (verifyButton) {
  const pendingText = sessionStorage.getItem(PENDING_KEY);
  const emailLabel = document.getElementById("verifyEmail");
  const otpInput = document.getElementById("otpInput");
  const resendButton = document.getElementById("resendBtn");

  let pendingData = null;

  try {
    pendingData = pendingText ? JSON.parse(pendingText) : null;
  } catch {
    pendingData = null;
  }

  if (!pendingData || !pendingData.email) {
    showMessage("Registration তথ্য পাওয়া যায়নি। আবার Registration করো।");
    verifyButton.disabled = true;
    if (resendButton) resendButton.disabled = true;
  } else {
    emailLabel.textContent = pendingData.email;
  }

  otpInput.addEventListener("input", () => {
    otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 8);
  });

  // VERIFY OTP
  verifyButton.addEventListener("click", async () => {
    if (!pendingData) return;

    const token = otpInput.value.trim();

    if (!/^[0-9]{8}$/.test(token)) {
      showMessage("ইমেইলে আসা ৮ সংখ্যার OTP লিখো।");
      return;
    }

    verifyButton.disabled = true;
    verifyButton.textContent = "যাচাই হচ্ছে...";

    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email: pendingData.email,
        token,
        type: "email"
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("ব্যবহারকারীর তথ্য পাওয়া যায়নি।");
      }

      // OTP যাচাইয়ের পর Password সেট
      
const { error: passwordError } =
  await supabaseClient.auth.updateUser({
    password: pendingData.password
  });

if (
  passwordError &&
  !passwordError.message.toLowerCase().includes(
    "new password should be different"
  )
) {
  throw passwordError;
}


      // Profile-এর তথ্য নিশ্চিত করা
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          full_name: pendingData.fullName,
          username: pendingData.username,
          phone: pendingData.phone,
          class_level: pendingData.classLevel,
          student_group: pendingData.studentGroup
        })
        .eq("id", data.user.id);

      if (profileError) throw profileError;

      sessionStorage.removeItem(PENDING_KEY);

      showMessage("Email Verification সফল হয়েছে!", true);
      verifyButton.textContent = "সফল হয়েছে";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1800);

    } catch (error) {
      console.error(error);

      showMessage(
        error.message || "Verification ব্যর্থ হয়েছে। আবার চেষ্টা করো।"
      );

      verifyButton.disabled = false;
      verifyButton.textContent = "Verify Email";
    }
  });

  // RESEND OTP
  if (resendButton) {
    resendButton.addEventListener("click", async () => {
      if (!pendingData) return;

      resendButton.disabled = true;
      resendButton.textContent = "পাঠানো হচ্ছে...";

      try {
        const { error } = await supabaseClient.auth.signInWithOtp({
          email: pendingData.email,
          options: {
            shouldCreateUser: false
          }
        });

        if (error) throw error;

        showMessage("নতুন OTP তোমার Email-এ পাঠানো হয়েছে।", true);

      } catch (error) {
        console.error(error);
        showMessage(error.message || "আবার OTP পাঠানো যায়নি।");

      } finally {
        resendButton.disabled = false;
        resendButton.textContent = "Resend OTP";
      }
    });
  }
}

// =========================================
// CLASSICAL ACADEMY - LOGIN SYSTEM
// =========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    loginMessage.textContent = "";

    try {
      // Supabase Login
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      // User Profile এবং Role যাচাই
      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError) throw profileError;

      loginMessage.style.color = "green";

      if (profile.role === "superadmin") {
        loginMessage.textContent = "Super Admin Login Successful!";

        setTimeout(() => {
          window.location.href = "admin/admin.html";
        }, 1000);

      } else if (
        ["admin", "moderator", "teacher"].includes(profile.role)
      ) {
        loginMessage.textContent = "Login Successful!";

        setTimeout(() => {
          window.location.href = "admin/admin.html";
        }, 1000);

      } else if (profile.role === "student") {
  loginMessage.textContent = "Student Login Successful!";

  setTimeout(() => {
    window.location.href = "student.html";
  }, 1000);
      }

    } catch (error) {
      console.error("Login Error:", error);

      loginMessage.style.color = "red";
      loginMessage.textContent =
        error.message || "Login failed. আবার চেষ্টা করো।";

    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}
