"use strict";

/* =========================================
   CLASSICAL ACADEMY
   SUPABASE ADMIN PANEL
========================================= */

const SUPABASE_URL =
  "https://fskfjvyetjuofappxqnw.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_m07iz_JW12ynejlP3hXVJQ_wzuXq_4X";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const roleSelect = document.getElementById("roleSelect");

let currentRole = "";
let currentUser = null;
let currentProfile = null;
let currentPage = "dashboard";
let welcomeData = {};
let settingsData = {};

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
    pages: ["dashboard", "students", "moderation", "activity"]
  },

  teacher: {
    name: "Teacher",
    title: "Course Teacher",
    pages: ["dashboard", "courses", "exams"]
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
   HELPERS
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

function money(value) {
  return "৳" + Number(value || 0).toLocaleString("en-BD");
}

function notify(message) {
  alert(message);
}

function getRole() {
  return ROLES[currentRole] || ROLES.student;
}

function canAccess(page) {
  return Boolean(getRole().pages?.includes(page));
}

function forbidden() {
  return `
    <div class="panel empty">
      <h2>⛔ Access Denied</h2>
      <p>You do not have permission to access this page.</p>
    </div>
  `;
}

function errorPage(message) {
  return `
    <div class="panel empty">
      <h3>Could not load data</h3>
      <p>${escapeHTML(message)}</p>
      <button class="btn" data-action="refresh">Try Again</button>
    </div>
  `;
}

function emptyRow(columns, message = "No records found.") {
  return `
    <tr>
      <td colspan="${columns}" style="text-align:center;padding:25px">
        ${escapeHTML(message)}
      </td>
    </tr>
  `;
}

function statusBadge(status) {
  const value = String(status || "Unknown");
  let css = "";

  if (["paid", "published", "active", "resolved"].includes(value.toLowerCase())) {
    css = "";
  } else if (["pending", "draft", "reviewing"].includes(value.toLowerCase())) {
    css = "pending";
  } else {
    css = "blocked";
  }

  return `<span class="status ${css}">${escapeHTML(value)}</span>`;
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

function makeTable(headers, rows) {
  return `
    <div class="table-card">
      <div class="table-head">
        <h3>Records</h3>
        <input class="search" id="tableSearch"
          placeholder="Search records...">
      </div>

      <div class="table-wrap">
        <table id="dataTable">
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${rows || emptyRow(headers.length)}</tbody>
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
      row.style.display =
        row.innerText.toLowerCase().includes(term) ? "" : "none";
    });
  });
}

async function logActivity(action, details = {}) {
  // Existing database policies only allow Super Admin to insert logs.
  if (currentRole !== "superadmin") return;

  const { error } = await supabaseClient
    .from("activity_logs")
    .insert({
      user_id: currentUser.id,
      action,
      details
    });

  if (error) console.error("Activity log:", error.message);
}

async function getCount(table, query = {}) {
  let request = supabaseClient
    .from(table)
    .select("*", { count: "exact", head: true });

  Object.entries(query).forEach(([key, value]) => {
    request = request.eq(key, value);
  });

  const { count, error } = await request;

  if (error) throw error;

  return count || 0;
}

async function getRows(table, columns = "*", options = {}) {
  let request = supabaseClient.from(table).select(columns);

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      request = request.eq(key, value);
    });
  }

  if (options.order) {
    request = request.order(
      options.order,
      { ascending: options.ascending ?? false }
    );
  }

  if (options.limit) request = request.limit(options.limit);

  const { data, error } = await request;

  if (error) throw error;

  return data || [];
}

async function saveSetting(key, value) {
  const { error } = await supabaseClient
    .from("site_settings")
    .upsert(
      {
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      },
      { onConflict: "setting_key" }
    );

  if (error) throw error;
}

async function loadSetting(key) {
  const { data, error } = await supabaseClient
    .from("site_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .maybeSingle();

  if (error) throw error;

  return data?.setting_value || {};
}

/* =========================================
   ROLE MANAGEMENT
========================================= */

function updateRole() {
  const role = getRole();

  const sideName = document.getElementById("sideName");
  const sideRole = document.getElementById("sideRole");
  const avatar = document.getElementById("avatar");

  if (sideName) {
    sideName.textContent =
      currentProfile?.full_name || role.name;
  }

  if (sideRole) sideRole.textContent = role.title;

  if (avatar) {
    avatar.textContent = (
      currentProfile?.full_name || role.name
    )
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }

  document.querySelectorAll(".nav-link").forEach(link => {
    link.style.display = canAccess(link.dataset.page)
      ? "flex"
      : "none";
  });

  if (!canAccess(currentPage)) currentPage = "dashboard";

  showPage(currentPage);
}

/* =========================================
   DASHBOARD
========================================= */

async function dashboard() {
  const stats = [];

  try {
    if (["superadmin", "admin"].includes(currentRole)) {
      const [students, teachers, courses, payments] =
        await Promise.all([
          getCount("profiles", { role: "student" }),
          getCount("profiles", { role: "teacher" }),
          getCount("courses"),
          getRows("payments", "amount,status")
        ]);

      const revenue = payments
        .filter(p => p.status === "paid")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      stats.push(
        statCard("Total Students", students, "♙", "Registered students"),
        statCard("Total Teachers", teachers, "♟", "Teaching staff"),
        statCard("Total Courses", courses, "▤", "Database courses"),
        statCard("Total Revenue", money(revenue), "৳", "Recorded paid payments")
      );
    } else if (currentRole === "teacher") {
      const [courses, exams] = await Promise.all([
        getCount("courses", { teacher_id: currentUser.id }),
        getCount("exams", { status: "published" })
      ]);

      stats.push(
        statCard("My Courses", courses, "▤", "Assigned courses"),
        statCard("Published Exams", exams, "✎", "Published examinations")
      );
    } else {
      const reports = await getRows("moderation_reports", "id,status");

      stats.push(
        statCard(
          "New Reports",
          reports.filter(r => r.status === "pending").length,
          "⚑",
          "Pending reports"
        ),
        statCard(
          "Under Review",
          reports.filter(r => r.status === "reviewing").length,
          "◷",
          "Reports being reviewed"
        ),
        statCard(
          "Resolved",
          reports.filter(r => r.status === "resolved").length,
          "✓",
          "Resolved reports"
        )
      );
    }

    let recent = [];

    if (currentRole === "superadmin") {
      recent = await getRows(
        "activity_logs",
        "action,created_at",
        { order: "created_at", limit: 5 }
      );
    }

    return `
      <div class="page-heading">
        <div>
          <h3>Welcome, ${escapeHTML(
            currentProfile?.full_name || getRole().name
          )} 👋</h3>
          <p>Classical Academy Management System</p>
        </div>
        <button class="btn" data-action="refresh">↻ Refresh</button>
      </div>

      <div class="stats-grid">${stats.join("")}</div>

      <div class="panel" style="margin-top:18px">
        <h3>Recent Activities</h3>
        ${
          recent.length
            ? recent.map(item => `
              <div class="activity-item">
                <span class="activity-dot"></span>
                <div>
                  ${escapeHTML(item.action)}
                  <small>${new Date(item.created_at).toLocaleString()}</small>
                </div>
              </div>
            `).join("")
            : `<p>No activity records available.</p>`
        }
      </div>
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

/* =========================================
   STUDENTS
========================================= */

async function studentsPage() {
  if (!["superadmin", "admin"].includes(currentRole)) {
    return forbidden();
  }

  try {
    const students = await getRows(
      "profiles",
      "id,full_name,email,username,phone,class_level,student_group,created_at",
      {
        filters: { role: "student" },
        order: "created_at"
      }
    );

    const rows = students.map(student => `
      <tr>
        <td>${escapeHTML(student.full_name || "—")}</td>
        <td>${escapeHTML(student.email || "—")}</td>
        <td>${escapeHTML(student.class_level || "—")}</td>
        <td>${escapeHTML(student.student_group || "—")}</td>
        <td>${escapeHTML(student.phone || "—")}</td>
        <td>${new Date(student.created_at).toLocaleDateString()}</td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Student Management</h3>
          <p>Real registered student accounts.</p>
        </div>
        <button class="btn" data-action="student-info">
          Add Student
        </button>
      </div>

      ${makeTable(
        ["Name", "Email", "Class", "Group", "Phone", "Joined"],
        rows
      )}

      <p style="font-size:12px;color:#858298;margin-top:12px">
        New student account creation will be enabled through a secure
        server-side invitation function.
      </p>
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

/* =========================================
   TEACHERS
========================================= */

async function teachersPage() {
  if (!["superadmin", "admin"].includes(currentRole)) {
    return forbidden();
  }

  try {
    const teachers = await getRows(
      "profiles",
      "id,full_name,email,phone,subject,created_at",
      {
        filters: { role: "teacher" },
        order: "created_at"
      }
    );

    const rows = teachers.map(teacher => `
      <tr>
        <td>${escapeHTML(teacher.full_name || "—")}</td>
        <td>${escapeHTML(teacher.email || "—")}</td>
        <td>${escapeHTML(teacher.subject || "—")}</td>
        <td>${escapeHTML(teacher.phone || "—")}</td>
        <td>${new Date(teacher.created_at).toLocaleDateString()}</td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Teacher Management</h3>
          <p>Registered teachers from Supabase.</p>
        </div>
        <button class="btn" data-action="teacher-info">
          Add Teacher
        </button>
      </div>

      ${makeTable(
        ["Name", "Email", "Subject", "Phone", "Joined"],
        rows
      )}

      <p style="font-size:12px;color:#858298;margin-top:12px">
        Teacher account creation requires the secure staff invitation function.
      </p>
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

/* =========================================
   COURSES
========================================= */

async function coursesPage() {
  try {
    const courses = await getRows(
      "courses",
      "id,title,description,class_level,subject,price,status,teacher_id,created_at",
      {
        filters: currentRole === "teacher"
          ? { teacher_id: currentUser.id }
          : {},
        order: "created_at"
      }
    );

    const teacherIds = [...new Set(
      courses.map(c => c.teacher_id).filter(Boolean)
    )];

    let teacherMap = {};

    if (teacherIds.length) {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("id,full_name")
        .in("id", teacherIds);

      if (!error) {
        (data || []).forEach(t => {
          teacherMap[t.id] = t.full_name;
        });
      }
    }

    const rows = courses.map(course => `
      <tr>
        <td>${escapeHTML(course.title)}</td>
        <td>${escapeHTML(teacherMap[course.teacher_id] || "—")}</td>
        <td>${escapeHTML(course.class_level || "—")}</td>
        <td>${money(course.price)}</td>
        <td>${statusBadge(course.status)}</td>
        <td>
          <button class="btn btn-light"
            data-action="edit-course"
            data-id="${course.id}">
            Edit
          </button>
          ${
            ["superadmin", "admin"].includes(currentRole)
              ? `<button class="btn btn-light"
                  data-action="delete-course"
                  data-id="${course.id}">
                  Delete
                </button>`
              : ""
          }
        </td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>${currentRole === "teacher" ? "My Courses" : "Course Management"}</h3>
          <p>Manage real database courses.</p>
        </div>
        <button class="btn" data-action="add-course">
          + Create Course
        </button>
      </div>

      ${makeTable(
        ["Course", "Teacher", "Class", "Price", "Status", "Action"],
        rows
      )}
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

async function addCourse() {
  if (!["superadmin", "admin", "teacher"].includes(currentRole)) {
    return notify("Access denied.");
  }

  const title = prompt("Course title:");
  if (!title?.trim()) return;

  const description = prompt("Course description:") || "";
  const classLevel = prompt("Class level:") || "";
  const subject = prompt("Subject:") || "";
  const priceText = prompt("Course price (BDT):", "0");

  const price = Number(priceText);

  if (!Number.isFinite(price) || price < 0) {
    return notify("Invalid course price.");
  }

  const course = {
    title: title.trim(),
    description: description.trim(),
    class_level: classLevel.trim(),
    subject: subject.trim(),
    price,
    status: "draft",
    teacher_id: currentRole === "teacher"
      ? currentUser.id
      : null
  };

  if (currentRole !== "teacher") {
    const teacherEmail = prompt(
      "Assigned teacher email (optional):"
    );

    if (teacherEmail?.trim()) {
      const { data: teacher, error } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", teacherEmail.trim())
        .eq("role", "teacher")
        .maybeSingle();

      if (error) return notify(error.message);

      if (!teacher) return notify("Teacher account not found.");

      course.teacher_id = teacher.id;
    }
  }

  const { error } = await supabaseClient
    .from("courses")
    .insert(course);

  if (error) return notify(error.message);

  await logActivity("Course created", { title: course.title });

  notify("Course created successfully.");
  showPage("courses");
}

async function editCourse(id) {
  const { data: course, error } = await supabaseClient
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return notify(error.message);

  const title = prompt("Course title:", course.title);
  if (!title?.trim()) return;

  const description = prompt(
    "Course description:",
    course.description || ""
  );

  const priceText = prompt(
    "Price (BDT):",
    String(course.price || 0)
  );

  const price = Number(priceText);

  if (!Number.isFinite(price) || price < 0) {
    return notify("Invalid price.");
  }

  const status = prompt(
    "Status: draft, published, archived",
    course.status
  );

  if (!["draft", "published", "archived"].includes(status)) {
    return notify("Invalid status.");
  }

  const { error: updateError } = await supabaseClient
    .from("courses")
    .update({
      title: title.trim(),
      description: description || "",
      price,
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (updateError) return notify(updateError.message);

  await logActivity("Course updated", { id, title });

  notify("Course updated.");
  showPage("courses");
}

async function deleteCourse(id) {
  if (!["superadmin", "admin"].includes(currentRole)) {
    return notify("Access denied.");
  }

  if (!confirm("Delete this course and its lessons?")) return;

  const { error } = await supabaseClient
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) return notify(error.message);

  await logActivity("Course deleted", { id });

  notify("Course deleted.");
  showPage("courses");
}

/* =========================================
   EXAMS
========================================= */

async function examsPage() {
  try {
    const exams = await getRows(
      "exams",
      "id,title,description,course_id,duration_minutes,total_marks,status,start_at,end_at,created_at",
      { order: "created_at" }
    );

    const rows = exams.map(exam => `
      <tr>
        <td>${escapeHTML(exam.title)}</td>
        <td>${escapeHTML(exam.duration_minutes)}</td>
        <td>${escapeHTML(exam.total_marks)}</td>
        <td>${statusBadge(exam.status)}</td>
        <td>
          ${
            ["superadmin", "admin"].includes(currentRole)
              ? `<button class="btn btn-light"
                  data-action="delete-exam"
                  data-id="${exam.id}">
                  Delete
                </button>`
              : "View"
          }
        </td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Exams & Results</h3>
          <p>Database examination records.</p>
        </div>

        ${
          ["superadmin", "admin"].includes(currentRole)
            ? `<button class="btn" data-action="add-exam">+ Create Exam</button>`
            : ""
        }
      </div>

      ${makeTable(
        ["Exam", "Duration (min)", "Total Marks", "Status", "Action"],
        rows
      )}
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

async function addExam() {
  if (!["superadmin", "admin"].includes(currentRole)) {
    return notify("Access denied.");
  }

  const title = prompt("Exam title:");
  if (!title?.trim()) return;

  const duration = Number(prompt("Duration in minutes:", "30"));
  const marks = Number(prompt("Total marks:", "100"));

  if (
    !Number.isFinite(duration) || duration <= 0 ||
    !Number.isFinite(marks) || marks <= 0
  ) {
    return notify("Invalid duration or marks.");
  }

  const { error } = await supabaseClient
    .from("exams")
    .insert({
      title: title.trim(),
      duration_minutes: duration,
      total_marks: marks,
      status: "draft"
    });

  if (error) return notify(error.message);

  await logActivity("Exam created", { title });

  notify("Exam created as draft.");
  showPage("exams");
}

async function deleteExam(id) {
  if (!["superadmin", "admin"].includes(currentRole)) return;

  if (!confirm("Delete this exam?")) return;

  const { error } = await supabaseClient
    .from("exams")
    .delete()
    .eq("id", id);

  if (error) return notify(error.message);

  notify("Exam deleted.");
  showPage("exams");
}

/* =========================================
   PAYMENTS
========================================= */

async function paymentsPage() {
  if (!["superadmin", "admin"].includes(currentRole)) {
    return forbidden();
  }

  try {
    const payments = await getRows(
      "payments",
      "id,student_id,amount,payment_method,transaction_id,status,created_at",
      { order: "created_at" }
    );

    const paid = payments.filter(p => p.status === "paid");

    const revenue = paid.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const rows = payments.map(payment => `
      <tr>
        <td>${escapeHTML(payment.transaction_id || "—")}</td>
        <td>${escapeHTML(payment.student_id)}</td>
        <td>${money(payment.amount)}</td>
        <td>${escapeHTML(payment.payment_method || "—")}</td>
        <td>${statusBadge(payment.status)}</td>
        <td>${new Date(payment.created_at).toLocaleDateString()}</td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Payment Management</h3>
          <p>Actual payment database records.</p>
        </div>
      </div>

      <div class="stats-grid">
        ${statCard("Total Revenue", money(revenue), "৳", "Paid records only")}
        ${statCard("Successful", paid.length, "✓", "Paid transactions")}
        ${statCard(
          "Pending",
          payments.filter(p => p.status === "pending").length,
          "◷",
          "Pending transactions"
        )}
        ${statCard("Total Transactions", payments.length, "▤", "All records")}
      </div>

      ${makeTable(
        ["Transaction ID", "Student ID", "Amount", "Method", "Status", "Date"],
        rows
      )}

      <p style="font-size:12px;color:#858298">
        Payment status must be verified by a secure payment gateway.
        This panel does not mark payments as paid.
      </p>
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

/* =========================================
   MODERATION
========================================= */

async function moderationPage() {
  if (!["superadmin", "admin", "moderator"].includes(currentRole)) {
    return forbidden();
  }

  try {
    const reports = await getRows(
      "moderation_reports",
      "id,reporter_id,reported_user_id,reason,description,status,created_at",
      { order: "created_at" }
    );

    const rows = reports.map(report => `
      <tr>
        <td>${escapeHTML(report.reason)}</td>
        <td>${escapeHTML(report.reporter_id || "—")}</td>
        <td>${escapeHTML(report.reported_user_id || "—")}</td>
        <td>${statusBadge(report.status)}</td>
        <td>${new Date(report.created_at).toLocaleDateString()}</td>
        <td>
          ${
            ["superadmin", "admin", "moderator"].includes(currentRole)
              ? `<button class="btn btn-light"
                  data-action="review-report"
                  data-id="${report.id}">
                  Review
                </button>`
              : ""
          }
        </td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Moderation Center</h3>
          <p>Actual reported items.</p>
        </div>
      </div>

      ${makeTable(
        ["Reason", "Reporter", "Reported User", "Status", "Date", "Action"],
        rows
      )}
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

async function reviewReport(id) {
  const status = prompt(
    "New status: pending, reviewing, resolved, rejected",
    "reviewing"
  );

  if (!["pending", "reviewing", "resolved", "rejected"].includes(status)) {
    return notify("Invalid status.");
  }

  const { error } = await supabaseClient
    .from("moderation_reports")
    .update({ status })
    .eq("id", id);

  if (error) return notify(error.message);

  notify("Report updated.");
  showPage("moderation");
}

/* =========================================
   STAFF & ROLES
========================================= */

async function staffPage() {
  if (currentRole !== "superadmin") return forbidden();

  try {
    const staff = await getRows(
      "profiles",
      "id,full_name,email,username,role,created_at",
      { order: "created_at" }
    );

    const members = staff.filter(member =>
      ["superadmin", "admin", "moderator", "teacher"].includes(member.role)
    );

    const rows = members.map(member => `
      <tr>
        <td>${escapeHTML(member.full_name || "—")}</td>
        <td>${escapeHTML(member.email || "—")}</td>
        <td>${escapeHTML(member.role)}</td>
        <td>${new Date(member.created_at).toLocaleDateString()}</td>
        <td>
          ${
            member.role === "superadmin"
              ? "Protected"
              : `<button class="btn btn-light"
                  data-action="staff-info">
                  Manage
                </button>`
          }
        </td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Staff & Role Management</h3>
          <p>Real staff accounts from Supabase.</p>
        </div>
        <button class="btn" data-action="staff-info">
          + Add Staff
        </button>
      </div>

      ${makeTable(
        ["Name", "Email", "Role", "Joined", "Action"],
        rows
      )}

      <div class="panel" style="margin-top:18px">
        <h3>Staff Account Security</h3>
        <p>
          Staff invitation and Role changes require a secure
          Supabase Edge Function. Direct browser-side role changes
          are disabled.
        </p>
      </div>
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

/* =========================================
   ACTIVITY LOGS
========================================= */

async function activityPage() {
  if (!["superadmin", "admin", "moderator"].includes(currentRole)) {
    return forbidden();
  }

  try {
    const activities = await getRows(
      "activity_logs",
      "id,user_id,action,details,created_at",
      { order: "created_at", limit: 100 }
    );

    const rows = activities.map(item => `
      <tr>
        <td>${escapeHTML(item.action)}</td>
        <td>${escapeHTML(item.user_id || "—")}</td>
        <td>${new Date(item.created_at).toLocaleString()}</td>
      </tr>
    `).join("");

    return `
      <div class="page-heading">
        <div>
          <h3>Activity Logs</h3>
          <p>Database activity records.</p>
        </div>
      </div>

      ${makeTable(["Action", "User ID", "Date"], rows)}
    `;
  } catch (error) {
    return errorPage(error.message);
  }
}

/* =========================================
   WELCOME PAGE EDITOR
========================================= */

async function welcomePageEditor() {
  if (currentRole !== "superadmin") return forbidden();

  try {
    welcomeData = await loadSetting("welcome_page");
  } catch (error) {
    return errorPage(error.message);
  }

  const data = {
    title: "Welcome to Classical Academy",
    subtitle: "Learn Better, Grow Faster",
    logo: "",
    banner: "",
    loginText: "Login",
    registerText: "Get Started",
    notice: "",
    color: "#6842d9",
    ...welcomeData
  };

  return `
    <div class="page-heading">
      <div>
        <h3>Welcome Page Editor</h3>
        <p>Manage public welcome page settings.</p>
      </div>
    </div>

    <div class="panel">
      <form id="welcomeForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Welcome Title</label>
            <input id="welcomeTitle"
              value="${escapeHTML(data.title)}" required>
          </div>

          <div class="form-group">
            <label>Subtitle</label>
            <input id="welcomeSubtitle"
              value="${escapeHTML(data.subtitle)}">
          </div>

          <div class="form-group">
            <label>Logo URL</label>
            <input id="welcomeLogo"
              value="${escapeHTML(data.logo)}">
          </div>

          <div class="form-group">
            <label>Banner URL</label>
            <input id="welcomeBanner"
              value="${escapeHTML(data.banner)}">
          </div>

          <div class="form-group">
            <label>Login Button Text</label>
            <input id="loginText"
              value="${escapeHTML(data.loginText)}">
          </div>

          <div class="form-group">
            <label>Registration Button Text</label>
            <input id="registerText"
              value="${escapeHTML(data.registerText)}">
          </div>

          <div class="form-group">
            <label>Announcement</label>
            <textarea id="welcomeNotice">${escapeHTML(data.notice)}</textarea>
          </div>

          <div class="form-group">
            <label>Theme Color</label>
            <input type="color" id="welcomeColor"
              value="${escapeHTML(data.color)}">
          </div>
        </div>

        <br>
        <button class="btn" type="submit">Save Welcome Page</button>
        <button class="btn btn-light" type="button"
          data-action="preview-welcome">Preview</button>
      </form>
    </div>

    <div class="panel" style="margin-top:20px">
      <h3>Live Preview</h3>
      <div id="welcomePreview"></div>
    </div>
  `;
}

function getWelcomeFormData() {
  return {
    title: document.getElementById("welcomeTitle")?.value.trim() || "",
    subtitle: document.getElementById("welcomeSubtitle")?.value.trim() || "",
    logo: document.getElementById("welcomeLogo")?.value.trim() || "",
    banner: document.getElementById("welcomeBanner")?.value.trim() || "",
    loginText: document.getElementById("loginText")?.value.trim() || "Login",
    registerText: document.getElementById("registerText")?.value.trim() || "Get Started",
    notice: document.getElementById("welcomeNotice")?.value.trim() || "",
    color: document.getElementById("welcomeColor")?.value || "#6842d9"
  };
}

function previewWelcome() {
  const preview = document.getElementById("welcomePreview");
  if (!preview) return;

  const data = getWelcomeFormData();

  preview.innerHTML = `
    <div style="text-align:center;padding:20px;background:#f7f5ff;border-radius:14px">
      ${
        data.logo
          ? `<img src="${escapeHTML(data.logo)}"
              alt="Logo"
              style="width:65px;height:65px;object-fit:contain">`
          : ""
      }

      ${
        data.banner
          ? `<img src="${escapeHTML(data.banner)}"
              alt="Banner"
              style="width:100%;max-height:170px;object-fit:cover;border-radius:12px">`
          : ""
      }

      <h2 style="color:${escapeHTML(data.color)}">
        ${escapeHTML(data.title)}
      </h2>

      <p>${escapeHTML(data.subtitle)}</p>
      <p>${escapeHTML(data.notice)}</p>
      <button class="btn"
        style="background:${escapeHTML(data.color)}">
        ${escapeHTML(data.loginText)}
      </button>
      <button class="btn btn-light">
        ${escapeHTML(data.registerText)}
      </button>
    </div>
  `;
}

async function saveWelcomePage(event) {
  event.preventDefault();

  if (currentRole !== "superadmin") return notify("Access denied.");

  try {
    const data = getWelcomeFormData();

    await saveSetting("welcome_page", data);

    await logActivity("Welcome page settings updated");

    notify("Welcome Page saved successfully.");
  } catch (error) {
    notify(error.message);
  }
}

/* =========================================
   PLATFORM SETTINGS
========================================= */

async function settingsPage() {
  if (currentRole !== "superadmin") return forbidden();

  try {
    settingsData = await loadSetting("platform_settings");
  } catch (error) {
    return errorPage(error.message);
  }

  const data = {
    academyName: "Classical Academy",
    supportEmail: "",
    phone: "",
    website: "",
    ...settingsData
  };

  return `
    <div class="page-heading">
      <div>
        <h3>Platform Settings</h3>
        <p>Manage academy information.</p>
      </div>
    </div>

    <div class="panel">
      <form id="settingsForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Academy Name</label>
            <input id="academyName"
              value="${escapeHTML(data.academyName)}" required>
          </div>

          <div class="form-group">
            <label>Support Email</label>
            <input id="supportEmail" type="email"
              value="${escapeHTML(data.supportEmail)}">
          </div>

          <div class="form-group">
            <label>Contact Number</label>
            <input id="supportPhone"
              value="${escapeHTML(data.phone)}">
          </div>

          <div class="form-group">
            <label>Website URL</label>
            <input id="websiteUrl"
              value="${escapeHTML(data.website)}">
          </div>
        </div>

        <br>
        <button class="btn" type="submit">Save Settings</button>
      </form>
    </div>
  `;
}

async function saveSettings(event) {
  event.preventDefault();

  if (currentRole !== "superadmin") return notify("Access denied.");

  const data = {
    academyName: document.getElementById("academyName").value.trim(),
    supportEmail: document.getElementById("supportEmail").value.trim(),
    phone: document.getElementById("supportPhone").value.trim(),
    website: document.getElementById("websiteUrl").value.trim()
  };

  try {
    await saveSetting("platform_settings", data);
    await logActivity("Platform settings updated");

    notify("Settings saved successfully.");
  } catch (error) {
    notify(error.message);
  }
}

/* =========================================
   ROUTING
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

async function showPage(page) {
  if (!canAccess(page) || !PAGES[page]) {
    content.innerHTML = forbidden();
    return;
  }

  currentPage = page;

  pageTitle.textContent = PAGE_NAMES[page] || "Dashboard";

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  content.innerHTML = `
    <div class="panel" style="text-align:center;padding:35px">
      Loading...
    </div>
  `;

  try {
    const html = await PAGES[page]();

    // Avoid showing an old page if user navigated elsewhere.
    if (currentPage !== page) return;

    content.innerHTML = html;

    if (page === "welcome") previewWelcome();

    attachSearch();
  } catch (error) {
    if (currentPage === page) {
      content.innerHTML = errorPage(error.message);
    }
  }
}

/* =========================================
   ACTION HANDLER
========================================= */

content.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  button.disabled = true;

  try {
    switch (action) {
      case "refresh":
        await showPage(currentPage);
        break;

      case "add-course":
        await addCourse();
        break;

      case "edit-course":
        await editCourse(id);
        break;

      case "delete-course":
        await deleteCourse(id);
        break;

      case "add-exam":
        await addExam();
        break;

      case "delete-exam":
        await deleteExam(id);
        break;

      case "review-report":
        await reviewReport(id);
        break;

      case "preview-welcome":
        previewWelcome();
        break;

      case "student-info":
        notify(
          "Student account creation requires a secure server-side invitation function."
        );
        break;

      case "teacher-info":
      case "staff-info":
        notify(
          "Staff account creation and role changes require a secure Supabase Edge Function."
        );
        break;
    }
  } catch (error) {
    notify(error.message);
  } finally {
    button.disabled = false;
  }
});

/* =========================================
   FORMS
========================================= */

content.addEventListener("submit", event => {
  if (event.target.id === "welcomeForm") {
    saveWelcomePage(event);
  }

  if (event.target.id === "settingsForm") {
    saveSettings(event);
  }
});

/* =========================================
   NAVIGATION
========================================= */

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    showPage(link.dataset.page);

    document.getElementById("sidebar")?.classList.remove("open");
  });
});

document.getElementById("menuBtn")?.addEventListener("click", () => {
  document.getElementById("sidebar")?.classList.toggle("open");
});

/* =========================================
   LOGOUT
========================================= */

document.getElementById("logoutBtn")?.addEventListener(
  "click",
  async event => {
    const button = event.currentTarget;

    if (!confirm("তুমি কি সত্যিই Logout করতে চাও?")) return;

    button.disabled = true;

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      window.location.replace("../index.html");
    } catch (error) {
      notify(error.message);
      button.disabled = false;
    }
  }
);

/* =========================================
   AUTHENTICATION
========================================= */

async function initializeAdminPanel() {
  try {
    if (!window.supabase) {
      throw new Error("Supabase library not loaded.");
    }

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    currentUser = data.session?.user;

    if (!currentUser) {
      window.location.replace("../index.html");
      return;
    }

    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (profileError) throw profileError;

    const allowedRoles = [
      "superadmin",
      "admin",
      "moderator",
      "teacher"
    ];

    if (!allowedRoles.includes(profile.role)) {
      await supabaseClient.auth.signOut();

      alert("তোমার Admin Panel ব্যবহারের অনুমতি নেই।");

      window.location.replace("../index.html");
      return;
    }

    currentProfile = profile;
    currentRole = profile.role;

    if (roleSelect) {
      roleSelect.disabled = true;
      roleSelect.style.display = "none";
    }

    updateRole();

    await logActivity("Admin panel opened");

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
