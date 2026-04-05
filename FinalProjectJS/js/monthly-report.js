const byId = (id) => document.getElementById(id);

const getData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const getUsers = () => getData("users", []);

const getCurrentUserId = () =>
  localStorage.getItem("currentUser") ||
  localStorage.getItem("currentUserId") ||
  null;

const getUserScopedKey = (baseKey) => {
  const userId = getCurrentUserId();
  if (!userId) return baseKey;
  return `${baseKey}_${userId}`;
};

// Uu tien du lieu theo tai khoan, fallback du lieu key cu
const getBudgets = () => {
  const scoped = getData(getUserScopedKey("budgets"), null);
  if (scoped && typeof scoped === "object") return scoped;
  return getData("budgets", {});
};

// Uu tien du lieu theo tai khoan, fallback du lieu key cu
const getRemainingBudgets = () => {
  const scoped = getData(getUserScopedKey("remainingBudgets"), null);
  if (scoped && typeof scoped === "object") return scoped;
  return getData("remainingBudgets", {});
};

const formatVnd = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const getStatusFromRemaining = (remaining) =>
  Number(remaining) >= 0
    ? { key: "ok", label: "Đạt ngân sách", className: "status-ok" }
    : { key: "over", label: "Vượt ngân sách", className: "status-over" };

const getReportRows = () => {
  const budgets = getBudgets();
  const remainingBudgets = getRemainingBudgets();
  const monthSet = new Set([
    ...Object.keys(budgets || {}),
    ...Object.keys(remainingBudgets || {}),
  ]);

  return Array.from(monthSet)
    .sort()
    .map((month) => {
      const budget = Number(budgets[month] || 0);
      const remaining = Number(remainingBudgets[month] || 0);
      const spent = budget - remaining;
      const status = getStatusFromRemaining(remaining);

      return { month, budget, spent, remaining, status };
    });
};

const renderTable = (statusFilter = "all") => {
  const body = byId("reportTableBody");
  if (!body) return;

  const rows = getReportRows().filter((row) => {
    if (statusFilter === "all") return true;
    return row.status.key === statusFilter;
  });

  if (rows.length === 0) {
    body.innerHTML =
      '<tr><td colspan="5" class="empty">Không có dữ liệu thống kê.</td></tr>';
    return;
  }

  body.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.month}</td>
          <td>${formatVnd(row.budget)}</td>
          <td>${formatVnd(row.spent)}</td>
          <td>${formatVnd(row.remaining)}</td>
          <td><span class="status-badge ${row.status.className}">${row.status.label}</span></td>
        </tr>
      `,
    )
    .join("");
};

const filterByStatus = () => {
  const select = byId("statusFilter");
  if (!select) return;
  renderTable(select.value || "all");
};

const initAccountDropdown = () => {
  const accountEl = byId("account");
  const accountToggle = byId("accountToggle");
  const menuLogoutBtn = byId("menuLogout");

  const currentUserName = byId("currentUserName");
  const accountInfoName = byId("accountInfoName");
  const accountInfoEmail = byId("accountInfoEmail");
  const accountInfoRole = byId("accountInfoRole");

  const userId = getCurrentUserId();
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  const users = getUsers();
  const user = users.find((u) => String(u.id) === String(userId));

  if (currentUserName) currentUserName.textContent = "Tài khoản";
  if (accountInfoName) accountInfoName.textContent = user?.fullName || "-";
  if (accountInfoEmail) accountInfoEmail.textContent = user?.email || "-";
  if (accountInfoRole)
    accountInfoRole.textContent = `Vai trò: ${user?.role || "user"}`;

  if (!accountEl || !accountToggle) return;

  accountToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    accountEl.classList.toggle("open");
  });

  document.addEventListener("click", () => accountEl.classList.remove("open"));

  menuLogoutBtn?.addEventListener("click", () => {
    Swal.fire({
      title: "Bạn có chắc muốn đăng xuất?",
      text: "Bạn sẽ cần đăng nhập lại để tiếp tục.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, đăng xuất",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUserId");
        window.location.href = "login.html";
      }
    });
  });
};

const init = () => {
  initAccountDropdown();

  const statusFilter = byId("statusFilter");
  statusFilter?.addEventListener("change", filterByStatus);

  renderTable();
};

document.addEventListener("DOMContentLoaded", init);
