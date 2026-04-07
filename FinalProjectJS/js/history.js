const users = [
  {
    id: 1,
    fullName: "Nguyen Van A",
    email: "nguyenvana@gmail.com",
    password: "123456",
    status: true,
    phone: "0987654321",
    gender: true,
    role: "user",
  },
  {
    id: 2,
    fullName: "admin",
    email: "admin@gmail.com",
    password: "123456",
    status: true,
    phone: "0987654321",
    gender: true,
    role: "admin",
  },
  {
    id: 3,
    fullName: "Pham Thi B",
    email: "phamthib@gmail.com",
    password: "123456",
    status: true,
    phone: "0987654321",
    gender: false,
    role: "user",
  },
];

// Đọc/ghi localStorage, scope theo user và format dữ liệu.
const getData = (key, fallback) => {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
};

const setData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getCurrentUserId = () => {
  return localStorage.getItem("currentUser") || "guest";
};

const getLoggedInUserId = () => {
  return localStorage.getItem("currentUser");
};

const getUserScopedKey = (baseKey) => {
  return `${baseKey}_${getCurrentUserId()}`;
};

const getScopedData = (key, fallback) => {
  return getData(getUserScopedKey(key), fallback);
};

const setScopedData = (key, value) => {
  setData(getUserScopedKey(key), value);
};

const pad2 = (n) => {
  return String(n).padStart(2, "0");
};

const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

const getSelectedBudgetMonth = () => {
  return localStorage.getItem(getUserScopedKey("selectedBudgetMonth"));
};

const saveSelectedBudgetMonth = (month) => {
  localStorage.setItem(getUserScopedKey("selectedBudgetMonth"), month);
};

const formatVnd = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} VND`;
};

const getUsers = () => {
  return getData("users", users);
};
const saveUsers = (users) => {
  setData("users", users);
};
const getBudgets = () => {
  return getScopedData("budgets", {});
};
const saveBudgets = (data) => {
  setScopedData("budgets", data);
};
const getRemainingBudgets = () => {
  return getScopedData("remainingBudgets", {});
};
const saveRemainingBudgets = (data) => {
  setScopedData("remainingBudgets", data);
};

// Tính toán ngân sách: tổng đã chi theo tháng và cập nhật số dư.
const getSpentByMonth = (month) => {
  const transactions = getScopedData("transactions", []);
  return transactions
    .filter((item) => {
      return String(item.createdDate || "").startsWith(month);
    })
    .reduce((total, item) => {
      return total + Number(item.total || 0);
    }, 0);
};

const setRemainingByMonth = (month, remaining) => {
  const remainingBudgets = getRemainingBudgets();
  remainingBudgets[month] = Number(remaining || 0);
  saveRemainingBudgets(remainingBudgets);
};

// State UI của trang history: lọc, sắp xếp, và phân trang.
const state = {
  month: getSelectedBudgetMonth() || getCurrentMonth(),
  keyword: "",
  sort: "",
  page: 1,
  pageSize: 5,
};

const setHistoryWarning = (message, type = "error") => {
  const warning = document.getElementById("historyWarning");
  if (!warning) {
    return;
  }

  warning.textContent = message || "";
  warning.classList.toggle("success", type === "success");
};

// Khởi tạo storage và bảo vệ truy cập khi chưa đăng nhập.
const initStorage = () => {
  if (!localStorage.getItem("users")) {
    saveUsers(users);
  }

  const ensureScopedJson = (baseKey, fallback) => {
    const scopedKey = getUserScopedKey(baseKey);
    if (localStorage.getItem(scopedKey)) {
      return;
    }

    localStorage.setItem(scopedKey, JSON.stringify(fallback));
  };

  ensureScopedJson("transactions", []);
  ensureScopedJson("monthlyCategories", []);
  ensureScopedJson("budgets", {});
  ensureScopedJson("remainingBudgets", {});
};

const requireLogin = () => {
  const userId = getLoggedInUserId();
  if (!userId) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

const getCurrentUser = () => {
  const userId = getLoggedInUserId();
  if (!userId) {
    return null;
  }
  const users = getUsers();
  return (
    users.find((u) => {
      return String(u.id) === String(userId);
    }) || null
  );
};

// Header/Sidebar: đồng bộ trạng thái menu và thông tin tài khoản.
const setSidebarActiveByPage = () => {
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  if (!sidebarItems.length) {
    return;
  }

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
  const accountEl = document.getElementById("account");
  const accountToggle = document.getElementById("accountToggle");
  const currentUserName = document.getElementById("currentUserName");
  const accountInfoName = document.getElementById("accountInfoName");
  const accountInfoEmail = document.getElementById("accountInfoEmail");
  const accountInfoRole = document.getElementById("accountInfoRole");
  const menuLogoutBtn = document.getElementById("menuLogout");

  if (!accountEl || !accountToggle) {
    return;
  }

  const currentUser = getCurrentUser();

  if (currentUserName) {
    currentUserName.textContent = "Tài khoản";
  }
  if (accountInfoName) {
    accountInfoName.textContent =
      currentUser && currentUser.fullName ? currentUser.fullName : "-";
  }
  if (accountInfoEmail) {
    accountInfoEmail.textContent =
      currentUser && currentUser.email ? currentUser.email : "-";
  }
  if (accountInfoRole) {
    accountInfoRole.textContent =
      "Vai trò: " +
      (currentUser && currentUser.role ? currentUser.role : "user");
  }

  accountToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    accountEl.classList.toggle("open");
  });

  document.addEventListener("click", () => {
    accountEl.classList.remove("open");
  });

  if (menuLogoutBtn) {
    menuLogoutBtn.addEventListener("click", () => {
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
          window.location.href = "login.html";
        }
      });
    });
  }
};

// Danh mục: map categoryId -> name và render option theo tháng.
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
  const monthObj = monthly.find((m) => {
    return m.month === month;
  });
  return monthObj && monthObj.categories ? monthObj.categories : [];
};

const renderCategoryOptions = () => {
  const categoryInput = document.getElementById("categoryInput");
  if (!categoryInput) {
    return;
  }

  const categories = getCategoriesByMonth(state.month);

  categoryInput.innerHTML = [
    '<option value="">Tiền chi tiêu</option>',
    ...categories.map((cat) => {
      return `<option value="${cat.id}">${cat.name}</option>`;
    }),
  ].join("");
};

// Chuẩn hóa giao dịch và xử lý lọc/sort trước khi render.
const createTransactionViewModel = (item, index, categoryMap) => {
  const amount = Number(item.total || 0);
  const createdDate = String(item.createdDate || "");
  const month = createdDate.slice(0, 7);
  const categoryId = Number(item.categoryId);

  return {
    ...item,
    index,
    amount,
    month,
    categoryName: categoryMap.get(categoryId) || item.categoryName || "Khác",
  };
};

const getProcessedTransactions = () => {
  const transactions = getScopedData("transactions", []);
  const categoryMap = getCategoryMap();

  return transactions.map((item, index) => {
    return createTransactionViewModel(item, index, categoryMap);
  });
};

const filterAndSortTransactions = () => {
  const keyword = state.keyword.trim().toLowerCase();
  const rows = getProcessedTransactions().filter((row) => {
    return row.month === state.month;
  });

  let filteredRows = rows;

  if (keyword !== "") {
    filteredRows = rows.filter((row) => {
      const noteText = (row.note || "").toLowerCase();
      const categoryText = (row.categoryName || "").toLowerCase();

      const matchNote = noteText.includes(keyword);
      const matchCategory = categoryText.includes(keyword);

      return matchNote || matchCategory;
    });
  }

  if (state.sort === "amount-asc") {
    return [...filteredRows].sort((a, b) => {
      return a.amount - b.amount;
    });
  }

  if (state.sort === "amount-desc") {
    return [...filteredRows].sort((a, b) => {
      return b.amount - a.amount;
    });
  }

  return filteredRows;
};

// Bảng lịch sử: render rows, empty state và phân trang.
const renderTable = () => {
  const body = document.getElementById("historyTableBody");
  const empty = document.getElementById("historyEmpty");
  if (!body || !empty) {
    return;
  }

  const rows = filterAndSortTransactions();
  const totalPage = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPage) {
    state.page = totalPage;
  }

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  empty.hidden = rows.length !== 0;

  body.innerHTML = pageRows
    .map((row, idx) => {
      const stt = start + idx + 1;
      return `
        <tr>
          <td>${stt}</td>
          <td>${row.categoryName}</td>
          <td>${formatVnd(row.amount)}</td>
          <td>${row.note || "-"}</td>
          <td>
            <button type="button" class="delete-btn" data-index="${row.index}" title="Xoa">🗑</button>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPagination(rows.length, totalPage);
};

const renderPagination = (totalItems, totalPage) => {
  const pagination = document.getElementById("pagination");
  if (!pagination) {
    return;
  }

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

// CRUD giao dịch: xóa giao dịch và thêm nhanh từ form.
const deleteTransaction = (index) => {
  const transactions = getScopedData("transactions", []);
  if (index < 0 || index >= transactions.length) {
    return;
  }

  Swal.fire({
    title: "Bạn có chắc muốn xóa giao dịch này?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Có, xóa",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (!result.isConfirmed) {
      return;
    }

    transactions.splice(index, 1);
    setScopedData("transactions", transactions);
    setHistoryWarning("Đã xóa giao dịch.", "success");
    renderBudget();
    renderTable();
  });
};

const addTransaction = () => {
  const amountInput = document.getElementById("amountInput");
  const categoryInput = document.getElementById("categoryInput");
  const noteInput = document.getElementById("noteInput");

  if (!amountInput || !categoryInput || !noteInput) {
    return;
  }

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

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[state.month] || 0);
  const spentAmount = getSpentByMonth(state.month);
  const nextSpentAmount = spentAmount + amount;

  if (nextSpentAmount > budgetAmount) {
    const remainingAmount = Math.max(0, budgetAmount - spentAmount);
    setHistoryWarning(
      `Giao dịch vượt ngân sách tháng. Bạn chỉ còn ${formatVnd(remainingAmount)} để chi.`,
    );
    return;
  }

  const now = new Date();
  const dateText = `${state.month}-${pad2(now.getDate())}`;

  const transactions = getScopedData("transactions", []);
  transactions.unshift({
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

// Ngân sách tháng: render số dư còn lại và tìm kiếm lịch sử.
const renderBudget = () => {
  const remainingText = document.getElementById("remainingText");
  if (!remainingText) {
    return;
  }

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[state.month] || 0);
  const spentAmount = getSpentByMonth(state.month);
  const remainingAmount = budgetAmount - spentAmount;

  setRemainingByMonth(state.month, remainingAmount);
  remainingText.textContent = formatVnd(remainingAmount);
};

const searchHistory = () => {
  const searchInputElement = document.getElementById("searchInput");
  if (!searchInputElement) {
    return;
  }

  const keyword = searchInputElement.value.toLowerCase().trim();
  state.keyword = keyword;

  state.page = 1;
  renderTable();
};

// Khởi tạo tháng làm việc và bind toàn bộ sự kiện thao tác.
const initMonthBudget = () => {
  const monthInput = document.getElementById("monthSelect");
  if (!monthInput) {
    return;
  }

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
  const sortSelectElement = document.getElementById("sortSelect");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const addTransactionBtn = document.getElementById("addTransactionBtn");
  const tableBody = document.getElementById("historyTableBody");
  const pagination = document.getElementById("pagination");

  if (
    !sortSelectElement ||
    !searchInput ||
    !searchBtn ||
    !addTransactionBtn ||
    !tableBody ||
    !pagination
  )
    return;

  sortSelectElement.value = state.sort;

  sortSelectElement.addEventListener("change", () => {
    state.sort = sortSelectElement.value;
    state.page = 1;
    renderTable();
  });

  searchBtn.addEventListener("click", searchHistory);
  addTransactionBtn.addEventListener("click", addTransaction);
  [searchInput, addTransactionBtn].forEach((el) => {
    if (el) {
      el.addEventListener("focus", () => {
        setHistoryWarning("");
      });
    }
  });

  const amountInput = document.getElementById("amountInput");
  const categoryInput = document.getElementById("categoryInput");
  const noteInput = document.getElementById("noteInput");

  [amountInput, categoryInput, noteInput].forEach((el) => {
    if (el) {
      el.addEventListener("input", () => {
        setHistoryWarning("");
      });
    }
    if (el) {
      el.addEventListener("change", () => {
        setHistoryWarning("");
      });
    }
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchHistory();
    }
  });

  tableBody.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-index]");
    if (!btn) {
      return;
    }
    const index = Number(btn.dataset.index);
    deleteTransaction(index);
  });

  pagination.addEventListener("click", (event) => {
    const pageBtn = event.target.closest("button.page-btn");
    if (!pageBtn) {
      return;
    }

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
    if (!page) {
      return;
    }
    state.page = page;
    renderTable();
  });

  renderCategoryOptions();
  renderTable();
};

// Entry point: khởi tạo toàn bộ trang khi DOM sẵn sàng.
const init = () => {
  initStorage();
  if (!requireLogin()) {
    return;
  }

  setSidebarActiveByPage();
  initAccountDropdown();
  initMonthBudget();
  initHistoryActions();
  window.addEventListener("focus", renderBudget);
};

document.addEventListener("DOMContentLoaded", init);
