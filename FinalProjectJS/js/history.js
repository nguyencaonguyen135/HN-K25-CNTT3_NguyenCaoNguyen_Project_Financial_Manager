const byId = (id) => document.getElementById(id);

const users = [
  {
    id: 1,
    fullName: "Nguyen Van A",
    email: "nguyenvana@gmail.com",
    password: btoa("123456"),
    status: true,
    phone: "0987654321",
    gender: true,
    role: "user",
  },
  {
    id: 2,
    fullName: "admin",
    email: "admin@gmail.com",
    password: btoa("123456"),
    status: true,
    phone: "0987654321",
    gender: true,
    role: "admin",
  },
  {
    id: 3,
    fullName: "Pham Thi B",
    email: "phamthib@gmail.com",
    password: btoa("123456"),
    status: true,
    phone: "0987654321",
    gender: false,
    role: "user",
  },
];

const getData = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const setData = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const getCurrentUserId = () =>
  localStorage.getItem("currentUser") ||
  localStorage.getItem("currentUserId") ||
  "guest";

const getUserScopedKey = (baseKey) => `${baseKey}_${getCurrentUserId()}`;
const LEGACY_FINANCE_MIGRATION_DONE_KEY = "legacyFinanceMigratedOnce_v1";

const getScopedData = (key, fallback) =>
  getData(getUserScopedKey(key), fallback);

const setScopedData = (key, value) => setData(getUserScopedKey(key), value);

const pad2 = (n) => String(n).padStart(2, "0");
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
};

const getSelectedBudgetMonth = () =>
  localStorage.getItem(getUserScopedKey("selectedBudgetMonth"));

const saveSelectedBudgetMonth = (month) =>
  localStorage.setItem(getUserScopedKey("selectedBudgetMonth"), month);

const formatVnd = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const getUsers = () => getData("users", users);
const saveUsers = (users) => setData("users", users);
const getBudgets = () => getScopedData("budgets", {});
const saveBudgets = (data) => setScopedData("budgets", data);
const getRemainingBudgets = () => getScopedData("remainingBudgets", {});
const saveRemainingBudgets = (data) => setScopedData("remainingBudgets", data);

const getSpentByMonth = (month) => {
  const transactions = getScopedData("transactions", []);
  return transactions
    .filter((item) => String(item.createdDate || "").startsWith(month))
    .reduce((total, item) => total + Number(item.total || 0), 0);
};

const setRemainingByMonth = (month, remaining) => {
  const remainingBudgets = getRemainingBudgets();
  remainingBudgets[month] = Number(remaining || 0);
  saveRemainingBudgets(remainingBudgets);
};

const state = {
  month: getSelectedBudgetMonth() || getCurrentMonth(),
  keyword: "",
  sort: "amount-desc",
  page: 1,
  pageSize: 5,
};

const setHistoryWarning = (message, type = "error") => {
  const warning = byId("historyWarning");
  if (!warning) return;

  warning.textContent = message || "";
  warning.classList.toggle("success", type === "success");
};

const initStorage = () => {
  if (!localStorage.getItem("users")) saveUsers(users);
  const shouldUseLegacyData =
    localStorage.getItem(LEGACY_FINANCE_MIGRATION_DONE_KEY) !== "1";

  const migrateLegacyJson = (baseKey, fallback) => {
    const scopedKey = getUserScopedKey(baseKey);
    if (localStorage.getItem(scopedKey)) return;

    if (!shouldUseLegacyData) {
      localStorage.setItem(scopedKey, JSON.stringify(fallback));
      return;
    }

    const legacy = localStorage.getItem(baseKey);
    if (!legacy) {
      localStorage.setItem(scopedKey, JSON.stringify(fallback));
      return;
    }

    try {
      localStorage.setItem(scopedKey, JSON.stringify(JSON.parse(legacy)));
    } catch {
      localStorage.setItem(scopedKey, JSON.stringify(fallback));
    }
  };

  migrateLegacyJson("transactions", []);
  migrateLegacyJson("monthlyCategories", []);
  migrateLegacyJson("budgets", {});
  migrateLegacyJson("remainingBudgets", {});
  localStorage.setItem(LEGACY_FINANCE_MIGRATION_DONE_KEY, "1");
};

const requireLogin = () => {
  const userId =
    localStorage.getItem("currentUser") ||
    localStorage.getItem("currentUserId");
  if (!userId) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

const getCurrentUser = () => {
  const userId =
    localStorage.getItem("currentUser") ||
    localStorage.getItem("currentUserId");
  if (!userId) return null;
  const users = getUsers();
  return users.find((u) => String(u.id) === String(userId)) || null;
};

const setSidebarActiveByPage = () => {
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  if (!sidebarItems.length) return;

  const currentPath = window.location.pathname.toLowerCase();
  let currentPage = "information";

  if (
    currentPath.endsWith("/category.html") ||
    currentPath.endsWith("category.html")
  ) {
    currentPage = "category";
  } else if (
    currentPath.endsWith("/history.html") ||
    currentPath.endsWith("history.html")
  ) {
    currentPage = "history";
  }

  sidebarItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.page === currentPage);
  });
};

const initAccountDropdown = () => {
  const accountEl = byId("account");
  const accountToggle = byId("accountToggle");
  const currentUserNameEl = byId("currentUserName");
  const accountInfoName = byId("accountInfoName");
  const accountInfoEmail = byId("accountInfoEmail");
  const accountInfoRole = byId("accountInfoRole");
  const menuLogoutBtn = byId("menuLogout");

  if (!accountEl || !accountToggle) return;

  const user = getCurrentUser();
  if (currentUserNameEl) currentUserNameEl.textContent = "Tài khoản";
  if (accountInfoName) accountInfoName.textContent = user?.fullName || "-";
  if (accountInfoEmail) accountInfoEmail.textContent = user?.email || "-";
  if (accountInfoRole)
    accountInfoRole.textContent = `Vai trò: ${user?.role || "user"}`;

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

const getCategoryMap = () => {
  const monthly = getScopedData("monthlyCategories", []);
  const map = new Map();

  monthly.forEach((monthRecord) => {
    (monthRecord.categories || []).forEach((category) => {
      map.set(Number(category.id), category.name);
    });
  });

  return map;
};

const getCategoriesByMonth = (month) => {
  const monthly = getScopedData("monthlyCategories", []);
  const monthObj = monthly.find((m) => m.month === month);
  return monthObj?.categories || [];
};

const renderCategoryOptions = () => {
  const categoryInput = byId("categoryInput");
  if (!categoryInput) return;

  const categories = getCategoriesByMonth(state.month);

  categoryInput.innerHTML = [
    '<option value="">Tiền chi tiêu</option>',
    ...categories.map(
      (cat) => `<option value="${cat.id}">${cat.name}</option>`,
    ),
  ].join("");
};

const getProcessedTransactions = () => {
  const transactions = getScopedData("transactions", []);
  const categoryMap = getCategoryMap();

  return transactions.map((item, index) => {
    const amount = Number(item.total || 0);
    const createdDate = String(item.createdDate || "");
    const month = createdDate.slice(0, 7);
    const categoryId = Number(item.categoryId);

    return {
      ...item,
      __index: index,
      __amount: amount,
      __month: month,
      __categoryName:
        categoryMap.get(categoryId) || item.categoryName || "Khac",
    };
  });
};

const filterAndSortTransactions = () => {
  const keyword = state.keyword.trim().toLowerCase();
  let rows = getProcessedTransactions();

  rows = rows.filter((row) => row.__month === state.month);

  if (keyword) {
    rows = rows.filter((row) => {
      const note = String(row.note || "").toLowerCase();
      const category = String(row.__categoryName || "").toLowerCase();
      return note.includes(keyword) || category.includes(keyword);
    });
  }

  if (state.sort === "amount-asc") {
    rows.sort((a, b) => a.__amount - b.__amount);
  } else if (state.sort === "newest") {
    rows.sort(
      (a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0),
    );
  } else if (state.sort === "oldest") {
    rows.sort(
      (a, b) => new Date(a.createdDate || 0) - new Date(b.createdDate || 0),
    );
  } else {
    rows.sort((a, b) => b.__amount - a.__amount);
  }

  return rows;
};

const renderTable = () => {
  const body = byId("historyTableBody");
  const empty = byId("historyEmpty");
  if (!body || !empty) return;

  const rows = filterAndSortTransactions();
  const totalPage = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPage) state.page = totalPage;

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  empty.hidden = rows.length !== 0;

  body.innerHTML = pageRows
    .map((row, idx) => {
      const stt = start + idx + 1;
      return `
        <tr>
          <td>${stt}</td>
          <td>${row.__categoryName}</td>
          <td>${formatVnd(row.__amount)}</td>
          <td>${row.note || "-"}</td>
          <td>
            <button type="button" class="delete-btn" data-index="${row.__index}" title="Xoa">🗑</button>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPagination(rows.length, totalPage);
};

const renderPagination = (totalItems, totalPage) => {
  const pagination = byId("pagination");
  if (!pagination) return;

  if (totalItems <= state.pageSize) {
    pagination.innerHTML = "";
    return;
  }

  const pageButtons = Array.from({ length: totalPage }, (_, i) => {
    const page = i + 1;
    const activeClass = page === state.page ? "active" : "";
    return `<button type="button" class="page-btn ${activeClass}" data-page="${page}">${page}</button>`;
  }).join("");

  pagination.innerHTML = `
    <button type="button" class="page-btn" data-nav="prev" ${state.page === 1 ? "disabled" : ""}>←</button>
    ${pageButtons}
    <button type="button" class="page-btn" data-nav="next" ${state.page === totalPage ? "disabled" : ""}>→</button>
  `;
};

const deleteTransaction = (index) => {
  const transactions = getScopedData("transactions", []);
  if (index < 0 || index >= transactions.length) return;

  Swal.fire({
    title: "Bạn có chắc muốn xóa giao dịch này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Có, xóa",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (!result.isConfirmed) return;

    transactions.splice(index, 1);
    setScopedData("transactions", transactions);
    setHistoryWarning("Đã xóa giao dịch.", "success");
    renderBudget();
    renderTable();
  });
};

const addTransaction = () => {
  const amountInput = byId("amountInput");
  const categoryInput = byId("categoryInput");
  const noteInput = byId("noteInput");

  if (!amountInput || !categoryInput || !noteInput) return;

  const amount = Number(amountInput.value);
  const categoryId = Number(categoryInput.value);
  const note = String(noteInput.value || "").trim();

  if (!amount || amount <= 0) {
    setHistoryWarning("Vui lòng nhập số tiền hợp lệ.");
    return;
  }

  if (!categoryId) {
    setHistoryWarning("Vui lòng chọn danh mục chi tiêu.");
    return;
  }

  const now = new Date();
  const dateText = `${state.month}-${pad2(now.getDate())}`;

  const transactions = getScopedData("transactions", []);
  transactions.push({
    id: Date.now(),
    categoryId,
    total: amount,
    note,
    createdDate: dateText,
  });

  setScopedData("transactions", transactions);
  amountInput.value = "";
  noteInput.value = "";
  categoryInput.value = "";
  setHistoryWarning("Đã thêm giao dịch.", "success");

  state.page = 1;
  renderBudget();
  renderTable();
};

const renderBudget = () => {
  const remainingText = byId("remainingText");
  if (!remainingText) return;

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[state.month] || 0);
  const spentAmount = getSpentByMonth(state.month);
  const remainingAmount = budgetAmount - spentAmount;

  setRemainingByMonth(state.month, remainingAmount);
  remainingText.textContent = formatVnd(remainingAmount);
};

// Tim kiem giao dich theo tu khoa trong history
const searchHistory = () => {
  const searchInputElement = byId("searchInput");
  if (!searchInputElement) return;

  const keyword = searchInputElement.value.toLowerCase().trim();

  if (keyword.length === 0) {
    state.keyword = "";
  } else {
    state.keyword = keyword;
  }

  state.page = 1;
  renderTable();
};

const initMonthBudget = () => {
  const monthInput = byId("monthSelect");
  if (!monthInput) return;

  monthInput.value = state.month;
  saveSelectedBudgetMonth(state.month);

  monthInput.addEventListener("change", () => {
    state.month = monthInput.value || getCurrentMonth();
    saveSelectedBudgetMonth(state.month);
    state.page = 1;
    renderBudget();
    renderCategoryOptions();
    renderTable();
  });

  renderBudget();
};

const initHistoryActions = () => {
  const sortSelect = byId("sortSelect");
  const searchInput = byId("searchInput");
  const searchBtn = byId("searchBtn");
  const addTransactionBtn = byId("addTransactionBtn");
  const tableBody = byId("historyTableBody");
  const pagination = byId("pagination");

  if (
    !sortSelect ||
    !searchInput ||
    !searchBtn ||
    !addTransactionBtn ||
    !tableBody ||
    !pagination
  )
    return;

  sortSelect.value = state.sort;

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    state.page = 1;
    renderTable();
  });

  searchBtn.addEventListener("click", searchHistory);
  addTransactionBtn.addEventListener("click", addTransaction);
  [searchInput, addTransactionBtn].forEach((el) => {
    el?.addEventListener("focus", () => setHistoryWarning(""));
  });

  const amountInput = byId("amountInput");
  const categoryInput = byId("categoryInput");
  const noteInput = byId("noteInput");

  [amountInput, categoryInput, noteInput].forEach((el) => {
    el?.addEventListener("input", () => setHistoryWarning(""));
    el?.addEventListener("change", () => setHistoryWarning(""));
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchHistory();
  });

  tableBody.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-index]");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    deleteTransaction(index);
  });

  pagination.addEventListener("click", (event) => {
    const pageBtn = event.target.closest("button.page-btn");
    if (!pageBtn) return;

    const nav = pageBtn.dataset.nav;
    if (nav === "prev") {
      state.page = Math.max(1, state.page - 1);
      renderTable();
      return;
    }

    if (nav === "next") {
      const totalPage = Math.max(
        1,
        Math.ceil(filterAndSortTransactions().length / state.pageSize),
      );
      state.page = Math.min(totalPage, state.page + 1);
      renderTable();
      return;
    }

    const page = Number(pageBtn.dataset.page);
    if (!page) return;
    state.page = page;
    renderTable();
  });

  renderCategoryOptions();
  renderTable();
};

const init = () => {
  initStorage();
  if (!requireLogin()) return;

  setSidebarActiveByPage();
  initAccountDropdown();
  initMonthBudget();
  initHistoryActions();
  window.addEventListener("focus", renderBudget);
};

document.addEventListener("DOMContentLoaded", init);
