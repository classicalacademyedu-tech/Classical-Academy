"use strict";
const SUPABASE_URL = "https://fskfjvyetjuofappxqnw.supabase.co";
const SUPABASE_KEY = "sb_publishable_m07iz_JW12ynejlP3hXVJQ_wzuXq_4X";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
/* =========================================
   CLASSICAL ACADEMY ADMIN PANEL
   Frontend Demo Version
========================================= */

const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const roleSelect = document.getElementById("roleSelect");

const ROLES = {
  superadmin: {
    name: "Super Admin",
    title: "Super Administrator",
    pages: [
      "dashboard", "welcome", "students", "teachers",
      "courses", "exams", "payments", "moderation",
      "staff", "activity", "settings"
    ]
  },

  admin: {
    name: "Admin",
    title: "Administrator",
    pages: [
      "dashboard", "students", "teachers", "courses",
      "exams", "payments", "moderation", "activity"
    ]
  },

  moderator: {
    name: "Moderator",
    title: "Content Moderator",
    pages: [
      "dashboard", "students", "moderation", "activity"
    ]
  },

  teacher: {
    name: "Teacher",
    title: "Course Teacher",
    pages: [
      "dashboard", "courses", "exams"
    ]
  }
};

const PAGE_NAMES = {
  dashboard: "Dashboard",
  welcome: "Welcome Page Editor",
  students: "Students",
  teachers: "Teachers",
  courses: "Courses",
  exams: "Exams & Results",
  payments: "Payments",
  moderation: "Moderation",
  staff: "Staff & Roles",
  activity: "Activity Logs",
  settings: "Settings"
};

/* =========================================
   DEMO DATA
========================================= */

let students = [
  { id: 1, name: "Rahim Ahmed", email: "rahim@gmail.com", className: "Class 10", status: "Active" },
  { id: 2, name: "Nusrat Jahan", email: "nusrat@gmail.com", className: "Class 9", status: "Active" },
  { id: 3, name: "Sakib Hasan", email: "sakib@gmail.com", className: "Class 8", status: "Pending" },
  { id: 4, name: "Mim Akter", email: "mim@gmail.com", className: "Class 10", status: "Active" }
];

let teachers = [
  { id: 1, name: "Abdullah Sir", subject: "Mathematics", status: "Active" },
  { id: 2, name: "Nusrat Ma'am", subject: "English", status: "Active" },
  { id: 3, name: "Karim Sir", subject: "Physics", status: "Pending" }
];

let courses = [
  { id: 1, name: "SSC Mathematics", teacher: "Abdullah Sir", students: 250, status: "Active" },
  { id: 2, name: "English Grammar", teacher: "Nusrat Ma'am", students: 180, status: "Active" },
  { id: 3, name: "Physics Masterclass", teacher: "Karim Sir", students: 120, status: "Pending" }
];

let staff = [
  { id: 1, name: "System Owner", email: "owner@classicalacademy.com", role: "Super Admin", status: "Active" },
  { id: 2, name: "Admin One", email: "admin@classicalacademy.com", role: "Admin", status: "Active" },
  { id: 3, name: "Moderator One", email: "moderator@classicalacademy.com", role: "Moderator", status: "Active" },
  { id: 4, name: "Teacher One", email: "teacher@classicalacademy.com", role: "Teacher", status: "Active" }
];

let activities = [
  "Admin Panel initialized",
  "Dashboard opened",
  "Classical Academy management system started"
];

let currentRole = "";
let currentPage = "dashboard";

/* =========================================
   HELPER FUNCTIONS
========================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getRole() {
  return ROLES[currentRole];
}

function canAccess(page) {
  return getRole().pages.includes(page);
}

function notify(message) {
  alert(message);
}

function addActivity(message) {
  activities.unshift(message);
  activities = activities.slice(0, 100);
}

function requireAccess(page) {
  if (!canAccess(page)) {
    content.innerHTML = forbidden();
    return false;
  }
  return true;
}

function statusBadge(status) {
  let css = "";

  if (status === "Pending") css = "pending";
  if (status === "Blocked" || status === "Suspended") css = "blocked";

  return `<span class="status ${css}">${escapeHTML(status)}</span>`;
}

function statCard(label, value, icon, description) {
  return `
    <div class="stat-card">
      <div class="stat-top">
        <span>${escapeHTML(label)}</span>
        <span class="stat-icon">${icon}</span>
      </div>
      <h3>${escapeHTML(value)}</h3>
      <small>${escapeHTML(description)}</small>
    </div>
  `;
}

/* =========================================
   ROLE MANAGEMENT
========================================= */

function updateRole() {
  const role = getRole();

  document.getElementById("sideName").textContent = role.name;
  document.getElementById("sideRole").textContent = role.title;

  document.getElementById("avatar").textContent =
    role.name.split(" ").map(word => word[0]).join("");

  document.querySelectorAll(".nav-link").forEach(link => {
    const page = link.dataset.page;
    link.style.display = canAccess(page) ? "flex" : "none";
  });

  if (!canAccess(currentPage)) {
    currentPage = "dashboard";
  }

  showPage(currentPage);
}

/* =========================================
   DASHBOARD
========================================= */

function dashboard() {
  let stats = "";

  if (currentRole === "superadmin" || currentRole === "admin") {
    stats = [
      statCard("Total Students", students.length.toLocaleString(), "♙", "Registered students"),
      statCard("Total Teachers", teachers.length.toLocaleString(), "♟", "Teaching staff"),
      statCard("Total Courses", courses.length.toLocaleString(), "▤", "Available courses"),
      statCard("Total Revenue", "৳1,25,000", "৳", "Demo statistics")
    ].join("");
  }

  if (currentRole === "moderator") {
    stats = [
      statCard("New Reports", "18", "⚑", "Demo reports"),
      statCard("Open Complaints", "12", "✉", "Support requests"),
      statCard("Reviewed Items", "120", "✓", "Demo statistics"),
      statCard("Flagged Accounts", "5", "♙", "Needs attention")
    ].join("");
  }

  if (currentRole === "teacher") {
    stats = [
      statCard("My Courses", "4", "▤", "Assigned courses"),
      statCard("My Students", "320", "♙", "Demo students"),
      statCard("Assignments", "28", "✎", "Demo statistics"),
      statCard("Pending Results", "8", "◷", "Need grading")
    ].join("");
  }

  return `
    <div class="page-heading">
      <div>
        <h3>Welcome, ${escapeHTML(getRole().name)} 👋</h3>
        <p>Welcome to Classical Academy Management System.</p>
      </div>
      <button class="btn" onclick="showPage('dashboard')">↻ Refresh</button>
    </div>

    <div class="stats-grid">${stats}</div>

    <div class="dashboard-grid">
      <div class="panel">
        <h3>Platform Overview</h3>
        <div class="bar-chart">
          ${[45, 75, 55, 90, 65, 80, 60].map((height, i) => `
            <div class="bar-item">
              <div class="bar" style="height:${height}%"></div>
              ${["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i]}
            </div>
          `).join("")}
        </div>
        <p style="color:#858298;font-size:11px">
          Demo chart. Connect a database for real statistics.
        </p>
      </div>

      <div class="panel">
        <h3>Recent Activities</h3>
        ${activities.slice(0, 5).map(item => `
          <div class="activity-item">
            <span class="activity-dot"></span>
            <div>${escapeHTML(item)}<small>Recent activity</small></div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="panel" style="margin-top:18px">
      <h3>Quick Actions</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${canAccess("welcome") ? `<button class="btn" onclick="showPage('welcome')">Edit Welcome Page</button>` : ""}
        ${canAccess("students") ? `<button class="btn btn-light" onclick="showPage('students')">Students</button>` : ""}
        ${canAccess("courses") ? `<button class="btn btn-light" onclick="showPage('courses')">Courses</button>` : ""}
        ${canAccess("exams") ? `<button class="btn btn-light" onclick="showPage('exams')">Exams</button>` : ""}
        ${canAccess("moderation") ? `<button class="btn btn-light" onclick="showPage('moderation')">Moderation</button>` : ""}
      </div>
    </div>
  `;
}

/* =========================================
   WELCOME PAGE EDITOR
   SUPER ADMIN ONLY
========================================= */

const defaultWelcome = {
  title: "Welcome to Classical Academy",
  subtitle: "Learn Better, Grow Faster",
  logo: "",
  banner: "",
  loginText: "Login",
  registerText: "Get Started",
  notice: "Your learning journey starts here.",
  color: "#6842d9"
};

function getWelcomeData() {
  try {
    const saved = localStorage.getItem("ca_welcome_page");
    return saved ? { ...defaultWelcome, ...JSON.parse(saved) } : { ...defaultWelcome };
  } catch {
    return { ...defaultWelcome };
  }
}

function welcomePageEditor() {
  if (currentRole !== "superadmin") return forbidden();

  const data = getWelcomeData();

  return `
    <div class="page-heading">
      <div>
        <h3>Welcome Page Editor</h3>
        <p>Control your public Classical Academy welcome page.</p>
      </div>
    </div>

    <div class="panel">
      <form id="welcomeForm">
        <div class="form-grid">

          <div class="form-group">
            <label>Welcome Title</label>
            <input id="welcomeTitle" value="${escapeHTML(data.title)}" required>
          </div>

          <div class="form-group">
            <label>Subtitle</label>
            <input id="welcomeSubtitle" value="${escapeHTML(data.subtitle)}">
          </div>

          <div class="form-group">
            <label>Logo Image URL</label>
            <input id="welcomeLogo" value="${escapeHTML(data.logo)}" placeholder="https://example.com/logo.png">
          </div>

          <div class="form-group">
            <label>Banner Image URL</label>
            <input id="welcomeBanner" value="${escapeHTML(data.banner)}" placeholder="https://example.com/banner.jpg">
          </div>

          <div class="form-group">
            <label>Login Button Text</label>
            <input id="loginText" value="${escapeHTML(data.loginText)}">
          </div>

          <div class="form-group">
            <label>Registration Button Text</label>
            <input id="registerText" value="${escapeHTML(data.registerText)}">
          </div>

          <div class="form-group">
            <label>Announcement</label>
            <textarea id="welcomeNotice">${escapeHTML(data.notice)}</textarea>
          </div>

          <div class="form-group">
            <label>Theme Color</label>
            <input type="color" id="welcomeColor" value="${escapeHTML(data.color)}">
          </div>

        </div>

        <br>

        <button class="btn" type="submit">Save Welcome Page</button>
        <button class="btn btn-light" type="button" onclick="previewWelcome()">Preview</button>
      </form>
    </div>

    <div class="panel" style="margin-top:20px">
      <h3>Live Preview</h3>
      <div id="welcomePreview"></div>
    </div>
  `;
}

function previewWelcome() {
  const title = document.getElementById("welcomeTitle")?.value || "";
  const subtitle = document.getElementById("welcomeSubtitle")?.value || "";
  const logo = document.getElementById("welcomeLogo")?.value || "";
  const banner = document.getElementById("welcomeBanner")?.value || "";
  const login = document.getElementById("loginText")?.value || "Login";
  const register = document.getElementById("registerText")?.value || "Get Started";
  const notice = document.getElementById("welcomeNotice")?.value || "";
  const color = document.getElementById("welcomeColor")?.value || "#6842d9";

  const preview = document.getElementById("welcomePreview");
  if (!preview) return;

  preview.innerHTML = `
    <div style="text-align:center;padding:20px;background:#f7f5ff;border-radius:14px">
      ${logo ? `<img src="${escapeHTML(logo)}" alt="Logo" style="width:65px;height:65px;object-fit:contain">` : ""}
      ${banner ? `<img src="${escapeHTML(banner)}" alt="Banner" style="width:100%;max-height:170px;object-fit:cover;border-radius:12px">` : ""}
      <h2 style="color:${escapeHTML(color)}">${escapeHTML(title)}</h2>
      <p>${escapeHTML(subtitle)}</p>
      <p>${escapeHTML(notice)}</p>
      <button class="btn" style="background:${escapeHTML(color)}">${escapeHTML(login)}</button>
      <button class="btn btn-light">${escapeHTML(register)}</button>
    </div>
  `;
}

function saveWelcomePage(event) {
  event.preventDefault();

  if (currentRole !== "superadmin") {
    return notify("Access denied.");
  }

  const data = {
    title: document.getElementById("welcomeTitle").value.trim(),
    subtitle: document.getElementById("welcomeSubtitle").value.trim(),
    logo: document.getElementById("welcomeLogo").value.trim(),
    banner: document.getElementById("welcomeBanner").value.trim(),
    loginText: document.getElementById("loginText").value.trim(),
    registerText: document.getElementById("registerText").value.trim(),
    notice: document.getElementById("welcomeNotice").value.trim(),
    color: document.getElementById("welcomeColor").value
  };

  try {
    localStorage.setItem("ca_welcome_page", JSON.stringify(data));
    addActivity("Super Admin saved Welcome Page settings");
    previewWelcome();
    notify("Welcome Page settings saved in this browser.");
  } catch {
    notify("Could not save settings.");
  }
}

/* =========================================
   TABLE GENERATOR
========================================= */

function makeTable(headers, rows) {
  return `
    <div class="table-card">
      <div class="table-head">
        <h3>Records</h3>
        <input class="search" id="tableSearch" placeholder="Search records...">
      </div>

      <div class="table-wrap">
        <table id="dataTable">
          <thead>
            <tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function attachSearch() {
  const search = document.getElementById("tableSearch");
  const table = document.getElementById("dataTable");

  if (!search || !table) return;

  search.addEventListener("input", () => {
    const term = search.value.toLowerCase();

    table.querySelectorAll("tbody tr").forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(term) ? "" : "none";
    });
  });
}

/* =========================================
   STUDENTS
========================================= */

function studentsPage() {
  const rows = students.map(s => `
    <tr>
      <td>${escapeHTML(s.name)}</td>
      <td>${escapeHTML(s.email)}</td>
      <td>${escapeHTML(s.className)}</td>
      <td>${statusBadge(s.status)}</td>
      <td>
        ${currentRole !== "moderator"
          ? `<button class="btn btn-light" onclick="toggleStudent(${s.id})">${s.status === "Active" ? "Suspend" : "Activate"}</button>`
          : "View only"}
      </td>
    </tr>
  `).join("");

  return `
    <div class="page-heading">
      <div><h3>Student Management</h3><p>Manage student accounts.</p></div>
      ${currentRole !== "moderator" ? `<button class="btn" onclick="addStudent()">+ Add Student</button>` : ""}
    </div>
    ${makeTable(["Name", "Email", "Class", "Status", "Action"], rows)}
  `;
}

function addStudent() {
  if (!["superadmin", "admin"].includes(currentRole)) return forbidden();

  const name = prompt("Student full name:");
  if (!name?.trim()) return;

  const email = prompt("Student email:");
  if (!email?.trim()) return;

  const className = prompt("Student class (Class 6-10):") || "Not assigned";

  students.push({
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    className,
    status: "Pending"
  });

  addActivity("A demo student was added");
  showPage("students");
}

function toggleStudent(id) {
  if (!["superadmin", "admin"].includes(currentRole)) return forbidden();

  const student = students.find(s => s.id === id);
  if (!student) return;

  student.status = student.status === "Active" ? "Suspended" : "Active";

  addActivity("Student account status changed");
  showPage("students");
}

/* =========================================
   TEACHERS
========================================= */

function teachersPage() {
  const rows = teachers.map(t => `
    <tr>
      <td>${escapeHTML(t.name)}</td>
      <td>${escapeHTML(t.subject)}</td>
      <td>${statusBadge(t.status)}</td>
      <td><button class="btn btn-light" onclick="notify('Teacher: ${escapeHTML(t.name)}')">View</button></td>
    </tr>
  `).join("");

  return `
    <div class="page-heading">
      <div><h3>Teacher Management</h3><p>Manage academy teachers.</p></div>
      <button class="btn" onclick="addTeacher()">+ Add Teacher</button>
    </div>
    ${makeTable(["Teacher", "Subject", "Status", "Action"], rows)}
  `;
}

function addTeacher() {
  if (!["superadmin", "admin"].includes(currentRole)) return forbidden();

  const name = prompt("Teacher name:");
  if (!name?.trim()) return;

  const subject = prompt("Teacher subject:");
  if (!subject?.trim()) return;

  teachers.push({
    id: Date.now(),
    name: name.trim(),
    subject: subject.trim(),
    status: "Pending"
  });

  addActivity("A demo teacher was added");
  showPage("teachers");
}

/* =========================================
   COURSES
========================================= */

function coursesPage() {
  const visibleCourses = currentRole === "teacher"
    ? courses.filter(c => c.teacher === "Abdullah Sir")
    : courses;

  const rows = visibleCourses.map(c => `
    <tr>
      <td>${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.teacher)}</td>
      <td>${c.students}</td>
      <td>${statusBadge(c.status)}</td>
      <td><button class="btn btn-light" onclick="notify('Course: ${escapeHTML(c.name)}')">Manage</button></td>
    </tr>
  `).join("");

  return `
    <div class="page-heading">
      <div><h3>${currentRole === "teacher" ? "My Courses" : "Course Management"}</h3><p>Manage courses and lessons.</p></div>
      <button class="btn" onclick="addCourse()">+ Create Course</button>
    </div>
    ${makeTable(["Course", "Teacher", "Students", "Status", "Action"], rows)}
  `;
}

function addCourse() {
  if (!["superadmin", "admin", "teacher"].includes(currentRole)) return forbidden();

  const name = prompt("Course name:");
  if (!name?.trim()) return;

  const teacher = currentRole === "teacher"
    ? "Abdullah Sir"
    : prompt("Teacher name:") || "Not assigned";

  courses.push({
    id: Date.now(),
    name: name.trim(),
    teacher,
    students: 0,
    status: "Pending"
  });

  addActivity("A demo course was created");
  showPage("courses");
}

/* =========================================
   EXAMS & RESULTS
========================================= */

function examsPage() {
  return `
    <div class="page-heading">
      <div><h3>Exams & Results</h3><p>Manage quizzes, exams and results.</p></div>
      <button class="btn" onclick="notify('Exam creation backend is not connected yet.')">+ Create Exam</button>
    </div>

    <div class="stats-grid">
      ${statCard("Total Exams", "24", "✎", "Demo data")}
      ${statCard("Published Results", "18", "✓", "Demo data")}
      ${statCard("Pending Review", "8", "◷", "Demo data")}
      ${statCard("Submissions", "560", "▤", "Demo data")}
    </div>

    <div class="panel">
      <h3>Exam Management</h3>
      <p style="font-size:13px;color:#858298">
        Question management, grading and result publishing will be connected to the backend.
      </p>
    </div>
  `;
}

/* =========================================
   PAYMENTS
========================================= */

function paymentsPage() {
  if (!["superadmin", "admin"].includes(currentRole)) return forbidden();

  return `
    <div class="page-heading">
      <div><h3>Payment Management</h3><p>Monitor payment records.</p></div>
      <button class="btn" onclick="notify('Payment export requires backend integration.')">Export Report</button>
    </div>

    <div class="stats-grid">
      ${statCard("Total Revenue", "৳1,25,000", "৳", "Demo data")}
      ${statCard("Successful", "320", "✓", "Demo data")}
      ${statCard("Pending", "12", "◷", "Demo data")}
      ${statCard("Refund Requests", "3", "↶", "Demo data")}
    </div>

    <div class="panel">
      <h3>Payment Records</h3>
      <p style="color:#858298;font-size:13px">
        Real payment information requires a secure payment gateway and backend.
      </p>
    </div>
  `;
}

/* =========================================
   MODERATION
========================================= */

function moderationPage() {
  return `
    <div class="page-heading">
      <div><h3>Moderation Center</h3><p>Review reported content and complaints.</p></div>
    </div>

    <div class="stats-grid">
      ${statCard("New Reports", "18", "⚑", "Demo reports")}
      ${statCard("Under Review", "7", "◷", "Demo reports")}
      ${statCard("Resolved", "45", "✓", "Demo reports")}
      ${statCard("Flagged Accounts", "5", "♙", "Demo reports")}
    </div>

    <div class="panel">
      <h3>Reported Content</h3>
      <p style="font-size:13px;color:#858298">
        Reported comments, discussions and suspicious accounts will appear here after backend integration.
      </p>
      <button class="btn" onclick="notify('Moderation queue requires backend integration.')">Review Queue</button>
    </div>
  `;
}

/* =========================================
   STAFF & ROLES
========================================= */

function staffPage() {
  if (currentRole !== "superadmin") return forbidden();

  const rows = staff.map(member => `
    <tr>
      <td>${escapeHTML(member.name)}</td>
      <td>${escapeHTML(member.email)}</td>
      <td>${escapeHTML(member.role)}</td>
      <td>${statusBadge(member.status)}</td>
      <td>
        <button class="btn btn-light" onclick="changeStaffRole(${member.id})">Change Role</button>
      </td>
    </tr>
  `).join("");

  return `
    <div class="page-heading">
      <div><h3>Staff & Role Management</h3><p>Super Admin can manage staff access.</p></div>
      <button class="btn" onclick="addStaff()">+ Add Staff</button>
    </div>

    ${makeTable(["Name", "Email", "Role", "Status", "Action"], rows)}

    <div class="panel" style="margin-top:18px">
      <h3>Role Permissions</h3>
      <p style="font-size:12px;color:#858298">
        Super Admin: Full control including Welcome Page Editor.<br>
        Admin: Academic and operational management.<br>
        Moderator: Reports and content moderation.<br>
        Teacher: Own courses, students and results.
      </p>
    </div>
  `;
}

function addStaff() {
  if (currentRole !== "superadmin") return forbidden();

  const name = prompt("Staff full name:");
  if (!name?.trim()) return;

  const email = prompt("Staff email:");
  if (!email?.trim()) return;

  const role = prompt("Enter role: Admin, Moderator, Teacher");
  const validRoles = ["Admin", "Moderator", "Teacher"];

  if (!validRoles.includes(role)) {
    return notify("Invalid role.");
  }

  staff.push({
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    role,
    status: "Active"
  });

  addActivity("A new staff member was added");
  showPage("staff");
}

function changeStaffRole(id) {
  if (currentRole !== "superadmin") return forbidden();

  const member = staff.find(item => item.id === id);
  if (!member) return;

  if (member.role === "Super Admin") {
    return notify("The primary Super Admin role cannot be changed here.");
  }

  const newRole = prompt("New role: Admin, Moderator, Teacher");
  if (!["Admin", "Moderator", "Teacher"].includes(newRole)) {
    return notify("Invalid role.");
  }

  member.role = newRole;
  addActivity("A staff role was changed");
  showPage("staff");
}

/* =========================================
   ACTIVITY LOGS
========================================= */

function activityPage() {
  return `
    <div class="page-heading">
      <div><h3>Activity Logs</h3><p>Review recent platform activity.</p></div>
    </div>

    <div class="panel">
      ${activities.map(item => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>${escapeHTML(item)}<small>Recorded activity</small></div>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================================
   SETTINGS
========================================= */

function settingsPage() {
  if (currentRole !== "superadmin") return forbidden();

  return `
    <div class="page-heading">
      <div><h3>Platform Settings</h3><p>Manage academy information.</p></div>
    </div>

    <div class="panel">
      <form id="settingsForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Academy Name</label>
            <input value="Classical Academy" required>
          </div>

          <div class="form-group">
            <label>Support Email</label>
            <input type="email" placeholder="support@example.com">
          </div>

          <div class="form-group">
            <label>Contact Number</label>
            <input placeholder="+8801XXXXXXXXX">
          </div>

          <div class="form-group">
            <label>Website URL</label>
            <input placeholder="https://example.com">
          </div>
        </div>
        <br>
        <button class="btn" type="submit">Save Settings</button>
      </form>
    </div>
  `;
}

/* =========================================
   ACCESS DENIED
========================================= */

function forbidden() {
  return `
    <div class="panel empty">
      <h2>⛔ Access Denied</h2>
      <p>You do not have permission to access this page.</p>
    </div>
  `;
}

/* =========================================
   PAGE ROUTING
========================================= */

const PAGES = {
  dashboard,
  welcome: welcomePageEditor,
  students: studentsPage,
  teachers: teachersPage,
  courses: coursesPage,
  exams: examsPage,
  payments: paymentsPage,
  moderation: moderationPage,
  staff: staffPage,
  activity: activityPage,
  settings: settingsPage
};

function showPage(page) {
  if (!requireAccess(page)) return;

  currentPage = page;
  pageTitle.textContent = PAGE_NAMES[page] || "Dashboard";

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  content.innerHTML = PAGES[page]();

  if (page === "welcome") previewWelcome();
  attachSearch();
}

/* =========================================
   EVENT LISTENERS
========================================= */

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    showPage(link.dataset.page);
    document.getElementById("sidebar").classList.remove("open");
  });
});

if (roleSelect) {
  roleSelect.disabled = true;
  roleSelect.style.display = "none";
}

document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

const logoutButton = document.getElementById("logoutBtn");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {

    if (!confirm("তুমি কি সত্যিই Logout করতে চাও?")) {
      return;
    }

    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      window.location.replace("../index.html");

    } catch (error) {
      console.error("Logout error:", error);
      alert(error.message || "Logout করা যায়নি।");

      logoutButton.disabled = false;
      logoutButton.innerHTML = "↪ Logout";
    }

  });
}

content.addEventListener("submit", event => {
  if (event.target.id === "welcomeForm") {
    saveWelcomePage(event);
  }

  if (event.target.id === "settingsForm") {
    event.preventDefault();
    addActivity("Platform settings form submitted");
    notify("Demo settings submitted. Backend saving is not connected.");
  }
});

/* =========================================
   AUTHENTICATION & INITIALIZE
========================================= */

async function initializeAdminPanel() {

  try {

    // Check Supabase session
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData.session;

    if (!session) {
      window.location.replace("../index.html");
      return;
    }

    // Get actual user profile and role
    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

    if (profileError) throw profileError;

    const allowedRoles = [
      "superadmin",
      "admin",
      "moderator",
      "teacher"
    ];

    if (!profile || !allowedRoles.includes(profile.role)) {

      await supabaseClient.auth.signOut();

      alert("তোমার Admin Panel ব্যবহারের অনুমতি নেই।");

      window.location.replace("../index.html");
      return;
    }

    // Set role from database
    currentRole = profile.role;

    // Set actual user name
    const sideName = document.getElementById("sideName");

    if (sideName && profile.full_name) {
      sideName.textContent = profile.full_name;
    }

    // Hide role selector
    if (roleSelect) {
      roleSelect.disabled = true;
      roleSelect.style.display = "none";
    }

    addActivity("Authenticated user opened Admin Panel");

    updateRole();

  } catch (error) {

    console.error("Admin initialization error:", error);

    alert(
      error.message ||
      "Admin Panel চালু করা যায়নি। আবার Login করো।"
    );

    await supabaseClient.auth.signOut();

    window.location.replace("../index.html");
  }
}

initializeAdminPanel();
