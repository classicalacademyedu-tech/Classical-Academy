
const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const roleSelect = document.getElementById("roleSelect");

const roleInfo = {
  superadmin: {
    name: "Super Admin",
    title: "Super Administrator",
    pages: ["dashboard", "students", "teachers", "courses", "exams", "payments", "moderation", "staff", "activity", "settings"]
  },
  admin: {
    name: "Admin",
    title: "Administrator",
    pages: ["dashboard", "students", "teachers", "courses", "exams", "payments", "moderation", "activity"]
  },
  moderator: {
    name: "Moderator",
    title: "Content Moderator",
    pages: ["dashboard", "students", "moderation", "activity"]
  },
  teacher: {
    name: "Teacher",
    title: "Course Teacher",
    pages: ["dashboard", "courses", "exams"]
  }
};

const pageNames = {
  dashboard: "Dashboard",
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

const students = [
  { name: "Rahim Ahmed", email: "rahim@gmail.com", class: "Class 10", status: "Active" },
  { name: "Nusrat Jahan", email: "nusrat@gmail.com", class: "Class 9", status: "Active" },
  { name: "Sakib Hasan", email: "sakib@gmail.com", class: "Class 8", status: "Pending" },
  { name: "Mim Akter", email: "mim@gmail.com", class: "Class 10", status: "Active" }
];

const teachers = [
  { name: "Abdullah Sir", subject: "Mathematics", status: "Active" },
  { name: "Nusrat Ma'am", subject: "English", status: "Active" },
  { name: "Karim Sir", subject: "Physics", status: "Pending" }
];

const courses = [
  { name: "SSC Mathematics", teacher: "Abdullah Sir", students: 250, status: "Active" },
  { name: "English Grammar", teacher: "Nusrat Ma'am", students: 180, status: "Active" },
  { name: "Physics Masterclass", teacher: "Karim Sir", students: 120, status: "Pending" }
];

let currentRole = "superadmin";
let currentPage = "dashboard";

function getRole() {
  return roleInfo[currentRole];
}

function notify(message) {
  alert(message);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function canAccess(page) {
  return getRole().pages.includes(page);
}

function updateRole() {
  const role = getRole();

  document.getElementById("sideName").textContent = role.name;
  document.getElementById("sideRole").textContent = role.title;
  document.getElementById("avatar").textContent = role.name.split(" ").map(x => x[0]).join("");

  document.querySelectorAll(".nav-link").forEach(link => {
    const page = link.dataset.page;
    link.style.display = canAccess(page) ? "flex" : "none";
  });

  if (!canAccess(currentPage)) currentPage = "dashboard";
  showPage(currentPage);
}

function statCard(label, value, icon, change) {
  return `
    <div class="stat-card">
      <div class="stat-top">
        <span>${label}</span>
        <span class="stat-icon">${icon}</span>
      </div>
      <h3>${value}</h3>
      <small>${change}</small>
    </div>`;
}

function dashboard() {
  const role = currentRole;

  let stats = "";
  if (role === "superadmin" || role === "admin") {
    stats = [
      statCard("Total Students", "2,450", "♙", "+12% this month"),
      statCard("Total Teachers", "48", "♟", "+4 new teachers"),
      statCard("Total Courses", "86", "▤", "Across all classes"),
      statCard("Total Revenue", "৳1,25,000", "৳", "Demo statistics")
    ].join("");
  } else if (role === "moderator") {
    stats = [
      statCard("Reported Content", "18", "⚑", "Needs review"),
      statCard("Open Complaints", "12", "✉", "Support queue"),
      statCard("Reviewed Items", "120", "✓", "Demo statistics"),
      statCard("Flagged Accounts", "5", "♙", "Needs attention")
    ].join("");
  } else {
    stats = [
      statCard("My Courses", "4", "▤", "Your assigned courses"),
      statCard("My Students", "320", "♙", "Across your courses"),
      statCard("Assignments", "28", "✎", "Demo statistics"),
      statCard("Pending Results", "8", "◷", "Need grading")
    ].join("");
  }

  return `
    <div class="page-heading">
      <div>
        <h3>Welcome, ${getRole().name} 👋</h3>
        <p>Here is what's happening at Classical Academy.</p>
      </div>
      <button class="btn" onclick="notify('Dashboard refreshed!')">↻ Refresh</button>
    </div>

    <div class="stats-grid">${stats}</div>

    <div class="dashboard-grid">
      <div class="panel">
        <h3>${role === "teacher" ? "My Course Progress" : "Platform Overview"}</h3>
        <div class="bar-chart">
          ${[45, 75, 55, 90, 65, 80, 60].map((height, i) => `
            <div class="bar-item">
              <div class="bar" style="height:${height}%"></div>
              ${["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][i]}
            </div>`).join("")}
        </div>
        <p style="font-size:11px;color:#858298;margin-top:12px">
          Sample visualization — connect your database for live statistics.
        </p>
      </div>

      <div class="panel">
        <h3>Recent Activity</h3>
        ${[
          "A new student registered",
          "A course was updated",
          "A result was submitted",
          "New support request received"
        ].map(item => `
          <div class="activity-item">
            <span class="activity-dot"></span>
            <div>${item}<small>Recent demo activity</small></div>
          </div>`).join("")}
      </div>
    </div>

    <div class="table-card">
      <div class="table-head">
        <h3>Quick Actions</h3>
      </div>
      <div style="padding:0 18px 18px;display:flex;gap:10px;flex-wrap:wrap">
        ${canAccess("students") ? '<button class="btn" onclick="showPage(\'students\')">View Students</button>' : ""}
        ${canAccess("courses") ? '<button class="btn btn-light" onclick="showPage(\'courses\')">Manage Courses</button>' : ""}
        ${canAccess("exams") ? '<button class="btn btn-light" onclick="showPage(\'exams\')">Exams & Results</button>' : ""}
        ${canAccess("moderation") ? '<button class="btn btn-light" onclick="showPage(\'moderation\')">Review Reports</button>' : ""}
      </div>
    </div>`;
}

function makeTable(headers, rows) {
  return `
    <div class="table-card">
      <div class="table-head">
        <h3>Records</h3>
        <input class="search" id="tableSearch" placeholder="Search..." oninput="filterTable()">
      </div>
      <div class="table-wrap">
        <table id="dataTable">
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function statusBadge(status) {
  const type = status === "Active" ? "" : status === "Pending" ? "pending" : "blocked";
  return `<span class="status ${type}">${escapeHTML(status)}</span>`;
}

function studentsPage() {
  const rows = students.map((s, i) => `
    <tr>
      <td>${escapeHTML(s.name)}</td>
      <td>${escapeHTML(s.email)}</td>
      <td>${escapeHTML(s.class)}</td>
      <td>${statusBadge(s.status)}</td>
      <td><button class="btn btn-light" onclick="notify('Student: ${escapeHTML(s.name)}')">View</button></td>
    </tr>`).join("");

  return `
    <div class="page-heading">
      <div><h3>Student Management</h3><p>View and manage student accounts.</p></div>
      ${currentRole !== "moderator" ? '<button class="btn" onclick="addStudent()">+ Add Student</button>' : ""}
    </div>
    ${makeTable(["Name", "Email", "Class", "Status", "Action"], rows)}
  `;
}

function teachersPage() {
  const rows = teachers.map(t => `
    <tr>
      <td>${escapeHTML(t.name)}</td>
      <td>${escapeHTML(t.subject)}</td>
      <td>${statusBadge(t.status)}</td>
      <td><button class="btn btn-light" onclick="notify('Teacher profile: ${escapeHTML(t.name)}')">View</button></td>
    </tr>`).join("");

  return `
    <div class="page-heading">
      <div><h3>Teacher Management</h3><p>Manage teaching staff.</p></div>
      <button class="btn" onclick="addTeacher()">+ Add Teacher</button>
    </div>
    ${makeTable(["Teacher", "Subject", "Status", "Action"], rows)}
  `;
}

function coursesPage() {
  const myCourses = currentRole === "teacher"
    ? courses.filter(c => c.teacher === "Abdullah Sir")
    : courses;

  const rows = myCourses.map(c => `
    <tr>
      <td>${escapeHTML(c.name)}</td>
      <td>${escapeHTML(c.teacher)}</td>
      <td>${c.students}</td>
      <td>${statusBadge(c.status)}</td>
      <td><button class="btn btn-light" onclick="notify('Course: ${escapeHTML(c.name)}')">Manage</button></td>
    </tr>`).join("");

  return `
    <div class="page-heading">
      <div><h3>${currentRole === "teacher" ? "My Courses" : "Course Management"}</h3><p>Manage lessons and learning materials.</p></div>
      <button class="btn" onclick="addCourse()">+ Create Course</button>
    </div>
    ${makeTable(["Course", "Teacher", "Students", "Status", "Action"], rows)}
  `;
}

function examsPage() {
  return `
    <div class="page-heading">
      <div><h3>Exams & Results</h3><p>Manage assessments, quizzes and student results.</p></div>
      <button class="btn" onclick="notify('Connect the exam module to create real exams.')">+ Create Exam</button>
    </div>
    <div class="stats-grid">
      ${statCard("Total Exams", "24", "✎", "Demo data")}
      ${statCard("Published Results", "18", "✓", "Demo data")}
      ${statCard("Pending Review", "8", "◷", "Demo data")}
      ${statCard("Submissions", "560", "▤", "Demo data")}
    </div>
    <div class="panel">
      <h3>Exam Management</h3>
      <p style="font-size:13px;color:#858298">Exam creation, question management, grading and result publishing can be connected here.</p>
      <button class="btn btn-light" onclick="notify('Exam module is a frontend placeholder.')">Open Exam Module</button>
    </div>`;
}

function paymentsPage() {
  if (!["superadmin", "admin"].includes(currentRole)) return forbidden();

  return `
    <div class="page-heading">
      <div><h3>Payment Management</h3><p>Monitor transactions and payments.</p></div>
      <button class="btn" onclick="notify('Payment export requires backend integration.')">Export Report</button>
    </div>
    <div class="stats-grid">
      ${statCard("Total Revenue", "৳1,25,000", "৳", "Demo data")}
      ${statCard("Successful", "320", "✓", "Demo data")}
      ${statCard("Pending", "12", "◷", "Demo data")}
      ${statCard("Refund Requests", "3", "↶", "Demo data")}
    </div>
    <div class="panel"><h3>Payment records</h3><p style="color:#858298;font-size:13px">Connect a payment gateway and database to display real transactions.</p></div>`;
}

function moderationPage() {
  return `
    <div class="page-heading">
      <div><h3>Moderation Center</h3><p>Review reports and manage inappropriate content.</p></div>
    </div>
    <div class="stats-grid">
      ${statCard("New Reports", "18", "⚑", "Demo data")}
      ${statCard("Under Review", "7", "◷", "Demo data")}
      ${statCard("Resolved", "45", "✓", "Demo data")}
      ${statCard("Flagged Users", "5", "♙", "Demo data")}
    </div>
    <div class="panel">
      <h3>Reported Content</h3>
      <p style="font-size:13px;color:#858298">Reported comments, discussions and suspicious accounts will appear here after backend integration.</p>
      <button class="btn" onclick="notify('Moderation queue is a frontend placeholder.')">Review Queue</button>
    </div>`;
}

function staffPage() {
  if (currentRole !== "superadmin") return forbidden();

  return `
    <div class="page-heading">
      <div><h3>Staff & Role Management</h3><p>Manage admins, moderators and teachers.</p></div>
      <button class="btn" onclick="addStaff()">+ Add Staff</button>
    </div>
    ${makeTable(
      ["Name", "Role", "Permission", "Status"],
      `
      <tr><td>System Owner</td><td>Super Admin</td><td>Full Access</td><td>${statusBadge("Active")}</td></tr>
      <tr><td>Admin One</td><td>Admin</td><td>Management</td><td>${statusBadge("Active")}</td></tr>
      <tr><td>Moderator One</td><td>Moderator</td><td>Moderation</td><td>${statusBadge("Active")}</td></tr>
      <tr><td>Teacher One</td><td>Teacher</td><td>Own Courses</td><td>${statusBadge("Active")}</td></tr>
      `
    )}
    <div class="panel" style="margin-top:18px">
      <h3>Role Permissions</h3>
      <p style="font-size:12px;color:#858298">Super Admin: Full control. Admin: Academic and operational management. Moderator: Reports and content moderation. Teacher: Own courses, students and results.</p>
    </div>`;
}

function activityPage() {
  return `
    <div class="page-heading"><div><h3>Activity Logs</h3><p>Track important platform activities.</p></div></div>
    <div class="panel">
      ${[
        "Admin signed in",
        "Course information updated",
        "Student account created",
        "A report was reviewed",
        "Exam result submitted"
      ].map((x, i) => `
        <div class="activity-item">
          <span class="activity-dot"></span>
          <div>${x}<small>Demo log entry ${i + 1}</small></div>
        </div>`).join("")}
    </div>`;
}

function settingsPage() {
  if (currentRole !== "superadmin") return forbidden();

  return `
    <div class="page-heading"><div><h3>Platform Settings</h3><p>Manage your academy information.</p></div></div>
    <div class="panel">
      <form id="settingsForm">
        <div class="form-grid">
          <div class="form-group"><label>Academy Name</label><input value="Classical Academy" required></div>
          <div class="form-group"><label>Support Email</label><input type="email" placeholder="support@example.com"></div>
          <div class="form-group"><label>Contact Number</label><input placeholder="+8801XXXXXXXXX"></div>
          <div class="form-group"><label>Website URL</label><input placeholder="https://example.com"></div>
        </div>
        <br><button class="btn">Save Settings</button>
      </form>
    </div>`;
}

function forbidden() {
  return `<div class="panel empty">⛔ You do not have permission to access this page.</div>`;
}

function showPage(page) {
  if (!canAccess(page)) {
    content.innerHTML = forbidden();
    return;
  }

  currentPage = page;
  pageTitle.textContent = pageNames[page];

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  const pages = {
    dashboard,
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

  content.innerHTML = pages[page]();
}

function filterTable() {
  const search = document.getElementById("tableSearch");
  const table = document.getElementById("dataTable");
  if (!search || !table) return;

  const term = search.value.toLowerCase();
  table.querySelectorAll("tbody tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(term) ? "" : "none";
  });
}

function addStudent() {
  const name = prompt("Student name:");
  if (!name) return;
  const email = prompt("Student email:");
  if (!email) return;
  const className = prompt("Class (e.g. Class 10):") || "Not assigned";

  students.push({ name, email, class: className, status: "Pending" });
  showPage("students");
  notify("Demo student added. Real saving requires a backend.");
}

function addTeacher() {
  const name = prompt("Teacher name:");
  if (!name) return;
  const subject = prompt("Subject:");
  if (!subject) return;

  teachers.push({ name, subject, status: "Pending" });
  showPage("teachers");
  notify("Demo teacher added. Real saving requires a backend.");
}

function addCourse() {
  const name = prompt("Course name:");
  if (!name) return;
  const teacher = prompt("Teacher name:") || "Not assigned";

  courses.push({ name, teacher, students: 0, status: "Pending" });
  showPage("courses");
  notify("Demo course added. Real saving requires a backend.");
}

function addStaff() {
  notify("Staff creation form will be connected to secure authentication and role permissions in the backend.");
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.page);
    document.getElementById("sidebar").classList.remove("open");
  });
});

roleSelect.addEventListener("change", () => {
  currentRole = roleSelect.value;
  updateRole();
});

document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    notify("Connect this button to your login system to complete logout.");
  }
});

document.addEventListener("submit", event => {
  if (event.target.id === "settingsForm") {
    event.preventDefault();
    notify("Demo settings submitted. Connect a backend to save permanently.");
  }
});

updateRole();
