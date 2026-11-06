/* =========================================
   CLASSICAL ACADEMY
   SUPABASE AUTHENTICATION
========================================= */

// Supabase connection
const SUPABASE_URL = "https://fskfjvyetjuofappxqnw.supabase.co";
const SUPABASE_KEY = "sb_publishable_m07iz_JW12ynejlP3hXVJQ_wzuXq_4X";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const modal = document.getElementById("modal");
const body = document.getElementById("modalBody");
const toast = document.getElementById("toast");

let pendingOtpEmail = "";

// Notification
function notify(message) {
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 3500);
}

// Form field
function field(label, type = "text", placeholder = "") {
  return `
    <label class="field">
      <span>${label}</span>
      <input type="${type}" placeholder="${placeholder}" required>
    </label>
  `;
}

// Error message
function showError(error) {
  console.error(error);
  notify(error.message || "কোনো সমস্যা হয়েছে। আবার চেষ্টা করো।");
}

// Modal
function openModal(which) {
  modal.classList.add("show");

  if (which === "login") {
    loginForm();
  } else {
    registerForm();
  }
}

// =========================================
// LOGIN
// =========================================

function loginForm() {
  body.innerHTML = `
    <h2>স্বাগতম!</h2>
    <p>তোমার Classical Academy অ্যাকাউন্টে লগইন করো।</p>

    <form id="loginForm">
      ${field("Email Address", "email", "name@example.com")}
      ${field("Password", "password", "তোমার পাসওয়ার্ড")}

      <div style="text-align:right;font-size:13px">
        <a class="link" id="forgot">পাসওয়ার্ড ভুলে গেছ?</a>
      </div>

      <button class="btn primary" id="loginBtn">
        লগইন
      </button>
    </form>

    <p style="text-align:center;margin-top:16px">
      অ্যাকাউন্ট নেই?
      <a class="link" id="goRegister">তৈরি করো</a>
    </p>
  `;

  document.getElementById("loginForm").onsubmit = async (e) => {
    e.preventDefault();

    const inputs = e.target.querySelectorAll("input");
    const email = inputs[0].value.trim();
    const password = inputs[1].value;
    const button = document.getElementById("loginBtn");

    button.disabled = true;
    button.textContent = "লগইন হচ্ছে...";

    try {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) throw error;

      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError) throw profileError;

      notify("লগইন সফল হয়েছে!");

      if (
        profile.role === "superadmin" ||
        profile.role === "admin"
      ) {
        setTimeout(() => {
          window.location.href = "admin/admin.html";
        }, 800);
      } else {
        setTimeout(() => {
          modal.classList.remove("show");
          location.reload();
        }, 800);
      }

    } catch (error) {
      showError(error);
    } finally {
      button.disabled = false;
      button.textContent = "লগইন";
    }
  };

  document.getElementById("forgot").onclick = forgotForm;
  document.getElementById("goRegister").onclick = registerForm;
}

// =========================================
// REGISTRATION
// =========================================

function registerForm() {
  pendingOtpEmail = "";

  body.innerHTML = `
    <h2>নতুন অ্যাকাউন্ট</h2>
    <p>Classical Academy-তে শেখা শুরু করো।</p>

    <form id="regForm">

      ${field("Full Name", "text", "তোমার পূর্ণ নাম")}
      ${field("Username", "text", "একটি Username দাও")}
      ${field("Email", "email", "name@example.com")}

      <button type="button" class="btn outline" id="emailVerify">
        ইমেইল ভেরিফিকেশন কোড পাঠাও
      </button>

      ${field("Email Verification Code", "text", "৬ সংখ্যার কোড")}
      ${field("Mobile Number", "tel", "01XXXXXXXXX")}

      <label class="field">
        <span>Class</span>
        <select id="classSelect" required>
          <option value="">Select class</option>
          ${[6, 7, 8, 9, 10].map(x =>
            `<option value="${x}">${x}</option>`
          ).join("")}
        </select>
      </label>

      <div id="groupWrap" hidden>
        <label class="field">
          <span>Select your group</span>
          <select id="groupSelect">
            <option value="">Select group</option>
            <option value="Science">Science</option>
            <option value="Humanities">Humanities</option>
            <option value="Business Studies">Business Studies</option>
          </select>
        </label>
      </div>

      ${field("Password", "password", "কমপক্ষে ৮ অক্ষর")}

      <div class="hint">
        পাসওয়ার্ডে ৮+ অক্ষর, বড় ও ছোট হাতের অক্ষর,
        সংখ্যা এবং বিশেষ চিহ্ন থাকতে হবে।
      </div>

      ${field("Confirm Password", "password", "পাসওয়ার্ড আবার লিখো")}

      <button class="btn primary" id="registerBtn">
        অ্যাকাউন্ট তৈরি
      </button>
    </form>
  `;

  const form = document.getElementById("regForm");
  const inputs = form.querySelectorAll("input");
  const classSelect = document.getElementById("classSelect");
  const groupWrap = document.getElementById("groupWrap");
  const groupSelect = document.getElementById("groupSelect");

  classSelect.onchange = () => {
    const needsGroup = ["9", "10"].includes(classSelect.value);

    groupWrap.hidden = !needsGroup;
    groupSelect.required = needsGroup;

    if (!needsGroup) groupSelect.value = "";
  };

  // Send real email OTP
  document.getElementById("emailVerify").onclick = async () => {
    const fullName = inputs[0].value.trim();
    const username = inputs[1].value.trim();
    const email = inputs[2].value.trim().toLowerCase();
    const phone = inputs[4].value.trim();
    const selectedClass = classSelect.value;
    const group = groupSelect.value;
    const password = inputs[5].value;
    const confirmPassword = inputs[6].value;

    if (!fullName || !username || !email || !phone || !selectedClass) {
      notify("সব প্রয়োজনীয় তথ্য পূরণ করো।");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
      notify("Username কমপক্ষে ৩ অক্ষরের হতে হবে। শুধু English letters, numbers ও _ ব্যবহার করো।");
      return;
    }

    if (["9", "10"].includes(selectedClass) && !group) {
      notify("তোমার Group নির্বাচন করো।");
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      notify("Password-এ বড় ও ছোট হাতের অক্ষর, সংখ্যা এবং বিশেষ চিহ্নসহ কমপক্ষে ৮ অক্ষর থাকতে হবে।");
      return;
    }

    if (password !== confirmPassword) {
      notify("দুটি Password মিলছে না।");
      return;
    }

    const button = document.getElementById("emailVerify");
    button.disabled = true;
    button.textContent = "কোড পাঠানো হচ্ছে...";

    try {
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

      pendingOtpEmail = email;
      notify("Classical Academy-এর Verification Code তোমার Email-এ পাঠানো হয়েছে।");

      button.textContent = "আবার কোড পাঠাও";

    } catch (error) {
      showError(error);
      button.textContent = "ইমেইল ভেরিফিকেশন কোড পাঠাও";
    } finally {
      button.disabled = false;
    }
  };

  // Verify OTP and finish registration
  form.onsubmit = async (e) => {
    e.preventDefault();

    const email = inputs[2].value.trim().toLowerCase();
    const token = inputs[3].value.trim();
    const password = inputs[5].value;
    const confirmPassword = inputs[6].value;

    if (!pendingOtpEmail || pendingOtpEmail !== email) {
      notify("প্রথমে এই Email-এ Verification Code পাঠাও।");
      return;
    }

    if (!/^[0-9]{6}$/.test(token)) {
      notify("সঠিক ৬ সংখ্যার Verification Code লিখো।");
      return;
    }

    if (password !== confirmPassword) {
      notify("দুটি Password মিলছে না।");
      return;
    }

    const button = document.getElementById("registerBtn");
    button.disabled = true;
    button.textContent = "যাচাই করা হচ্ছে...";

    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email,
        token,
        type: "email"
      });

      if (error) throw error;

      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError) throw profileError;

      // Set password after email OTP verification
      const { error: passwordError } =
        await supabaseClient.auth.updateUser({ password });

      if (passwordError) throw passwordError;

      notify(
        profile.role === "superadmin"
          ? "অভিনন্দন! তোমার প্রথম অ্যাকাউন্ট Super Admin হয়েছে।"
          : "অ্যাকাউন্ট তৈরি সফল হয়েছে!"
      );

      setTimeout(() => {
        if (
          profile.role === "superadmin" ||
          profile.role === "admin"
        ) {
          window.location.href = "admin/admin.html";
        } else {
          modal.classList.remove("show");
          location.reload();
        }
      }, 1500);

    } catch (error) {
      showError(error);
    } finally {
      button.disabled = false;
      button.textContent = "অ্যাকাউন্ট তৈরি";
    }
  };
}

// =========================================
// FORGOT PASSWORD
// =========================================

function forgotForm() {
  body.innerHTML = `
    <h2>পাসওয়ার্ড রিসেট</h2>
    <p>তোমার অ্যাকাউন্টের Email Address দাও।</p>

    <form id="forgotForm">
      ${field("Email Address", "email", "name@example.com")}
      <button class="btn primary">রিসেট লিংক পাঠাও</button>
    </form>
  `;

  document.getElementById("forgotForm").onsubmit = async (e) => {
    e.preventDefault();

    const email = e.target.querySelector("input").value.trim();

    try {
      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname
        });

      if (error) throw error;

      notify("Password reset link তোমার Email-এ পাঠানো হয়েছে।");

    } catch (error) {
      showError(error);
    }
  };
}

// =========================================
// RESET PASSWORD
// =========================================

function resetForm() {
  body.innerHTML = `
    <h2>নতুন পাসওয়ার্ড</h2>
    <p>তোমার নতুন Password লিখো।</p>

    <form id="resetForm">
      ${field("New Password", "password", "নতুন Password")}
      ${field("Confirm Password", "password", "আবার Password লিখো")}
      <button class="btn primary">পাসওয়ার্ড পরিবর্তন</button>
    </form>
  `;

  document.getElementById("resetForm").onsubmit = async (e) => {
    e.preventDefault();

    const inputs = e.target.querySelectorAll("input");
    const password = inputs[0].value;
    const confirm = inputs[1].value;

    if (password.length < 8 || password !== confirm) {
      notify("Password কমপক্ষে ৮ অক্ষরের হতে হবে এবং দুটি Password মিলতে হবে।");
      return;
    }

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password
      });

      if (error) throw error;

      notify("Password সফলভাবে পরিবর্তন হয়েছে।");

      setTimeout(loginForm, 1500);

    } catch (error) {
      showError(error);
    }
  };
}

// =========================================
// INITIAL PAGE EVENTS
// =========================================

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    openModal(button.dataset.open);
  });
});

const closeButton = document.getElementById("close");

if (closeButton) {
  closeButton.onclick = () => modal.classList.remove("show");
}

if (modal) {
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  };
}

const hamburger = document.getElementById("hamb");

if (hamburger) {
  hamburger.onclick = () => {
    document.getElementById("nav").classList.toggle("open");
  };
}

// Detect password recovery link
if (window.location.hash.includes("type=recovery")) {
  openModal("login");
  resetForm();
      }
