// localStorage và format dữ liệu dùng chung.
const getData = (key, fallback) => {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
};

const setData = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getCurrentUserId = () => {
  return localStorage.getItem("currentUser") || null;
};

const getUserScopedKey = (baseKey) => {
  return `${baseKey}_${getCurrentUserId()}`;
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

// Tách dữ liệu theo từng tài khoản đăng nhập.
const getBudgets = () => {
  return getData(getUserScopedKey("budgets"), {});
};
const getTransactions = () => {
  return getData(getUserScopedKey("transactions"), []);
};
const getMonthlyCategories = () => {
  return getData(getUserScopedKey("monthlyCategories"), []);
};
const saveMonthlyCategories = (data) => {
  setData(getUserScopedKey("monthlyCategories"), data);
};

let editingId = null;

// Tìm record category của tháng đang thao tác.
const getMonthRecord = (month) => {
  const monthly = getMonthlyCategories();
  return (
    monthly.find((m) => {
      return m.month === month;
    }) || null
  );
};

const ensureMonthRecord = (month) => {
  const monthly = getMonthlyCategories();
  let monthObj = monthly.find((m) => {
    return m.month === month;
  });

  if (!monthObj) {
    monthObj = { id: Date.now(), month, categories: [] };
    monthly.push(monthObj);
    saveMonthlyCategories(monthly);
  }

  return monthObj;
};

// Tính tổng chi tiêu theo từng category trong tháng hiện tại.
const getSpentByCategoryMap = (month) => {
  const transactions = getTransactions();
  const map = new Map();

  transactions
    .filter((t) => {
      return String(t.createdDate || "").startsWith(month);
    })
    .forEach((t) => {
      const categoryId = Number(t.categoryId);
      const amount = Number(t.total || 0);
      if (!categoryId) {
        return;
      }
      map.set(categoryId, (map.get(categoryId) || 0) + amount);
    });

  return map;
};

// Đồng bộ trường spent của category dựa trên transactions mới nhất.
const syncMonthSpent = (month) => {
  const monthly = getMonthlyCategories();
  const monthObj = monthly.find((m) => {
    return m.month === month;
  });
  if (!monthObj) {
    return;
  }

  const spentMap = getSpentByCategoryMap(month);
  let changed = false;

  monthObj.categories.forEach((cat) => {
    const nextSpent = spentMap.get(Number(cat.id)) || 0;
    if (Number(cat.spent || 0) !== nextSpent) {
      cat.spent = nextSpent;
      changed = true;
    }
  });

  if (changed) {
    saveMonthlyCategories(monthly);
  }
};

const getCategories = (month) => {
  const monthObj = getMonthRecord(month);
  return monthObj ? monthObj.categories || [] : [];
};

const saveCategories = (month, categories) => {
  const monthly = getMonthlyCategories();
  const monthObj = monthly.find((m) => {
    return m.month === month;
  });

  if (!monthObj) {
    monthly.push({ id: Date.now(), month, categories });
  } else {
    monthObj.categories = categories;
  }

  saveMonthlyCategories(monthly);
};

// Render danh sách category và cảnh báo vượt hạn mức.
const renderCategories = () => {
  const grid = document.getElementById("categoryGrid");
  const warning = document.getElementById("categoryWarning");
  const monthSelect = document.getElementById("monthSelect");

  if (!grid || !warning || !monthSelect) {
    return;
  }

  const month = monthSelect.value || getCurrentMonth();

  syncMonthSpent(month);

  const categories = getCategories(month);

  if (categories.length === 0) {
    grid.innerHTML =
      '<p class="empty">Chưa có danh mục nào trong tháng này.</p>';
    warning.textContent = "";
    return;
  }

  const hasOver = categories.some((cat) => {
    return Number(cat.spent || 0) > Number(cat.budget || 0);
  });
  warning.textContent = hasOver ? "Có danh mục đã vượt hạn mức." : "";

  grid.innerHTML = categories
    .map((category) => {
      const spent = Number(category.spent || 0);
      const budget = Number(category.budget || 0);
      const overClass = spent > budget ? "card-over" : "";

      return `
        <article class="category-card ${overClass}">
          <span class="card-icon">$</span>
          <div>
            <h4 class="card-title">${category.name}</h4>
            <p class="card-limit">${formatVnd(budget)} | Đã chi: ${formatVnd(spent)}</p>
          </div>
          <div class="card-actions">
            <button type="button" class="action-btn" data-action="delete" data-id="${category.id}" title="Xóa">✕</button>
            <button type="button" class="action-btn" data-action="edit" data-id="${category.id}" title="Sửa">🖋️</button>
          </div>
        </article>
      `;
    })
    .join("");
};

// Đưa form về trạng thái mặc định sau khi thêm/sửa/xóa.
const resetForm = () => {
  const categoryNameSelect = document.getElementById("categoryNameSelect");
  const categoryLimitInput = document.getElementById("categoryLimitInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const warning = document.getElementById("categoryWarning");

  if (categoryNameSelect) {
    categoryNameSelect.value = "";
  }
  if (categoryLimitInput) {
    categoryLimitInput.value = "";
  }
  if (addCategoryBtn) {
    addCategoryBtn.textContent = "Thêm danh mục";
  }
  if (warning) {
    warning.textContent = "";
  }

  editingId = null;
};

// Xử lý submit form: validate, thêm mới hoặc cập nhật category.
const handleSubmitForm = () => {
  const monthSelect = document.getElementById("monthSelect");
  const categoryNameSelect = document.getElementById("categoryNameSelect");
  const categoryLimitInput = document.getElementById("categoryLimitInput");
  const warning = document.getElementById("categoryWarning");

  if (!monthSelect || !categoryNameSelect || !categoryLimitInput || !warning) {
    return;
  }

  const month = monthSelect.value || getCurrentMonth();
  const name = String(categoryNameSelect.value || "").trim();
  const limit = Number(categoryLimitInput.value || 0);

  if (!name) {
    warning.textContent = "Vui lòng chọn tên danh mục.";
    return;
  }

  if (!limit || limit <= 0) {
    warning.textContent = "Giới hạn phải lớn hơn 0.";
    return;
  }

  ensureMonthRecord(month);
  const categories = getCategories(month);

  // Nhánh sửa category đã chọn.
  if (editingId) {
    const duplicated = categories.some(
      (item) =>
        Number(item.id) !== Number(editingId) &&
        String(item.name).toLowerCase() === name.toLowerCase(),
    );

    if (duplicated) {
      warning.textContent = "Tên danh mục đã tồn tại.";
      return;
    }

    const target = categories.find((item) => {
      return Number(item.id) === Number(editingId);
    });
    if (!target) {
      return;
    }

    target.name = name;
    target.budget = limit;

    saveCategories(month, categories);
    resetForm();
    renderCategories();

    Swal.fire({
      icon: "success",
      title: "Cập nhật thành công",
      text: "Danh mục đã được cập nhật.",
      timer: 1200,
      showConfirmButton: false,
    });

    return;
  }

  const duplicated = categories.some((item) => {
    return String(item.name).toLowerCase() === name.toLowerCase();
  });

  if (duplicated) {
    warning.textContent = "Tên danh mục đã tồn tại";
    return;
  }

  categories.push({
    id: Date.now(),
    name,
    budget: limit,
    spent: 0,
  });

  saveCategories(month, categories);
  resetForm();
  renderCategories();
};

// Nạp dữ liệu category vào form để chỉnh sửa.
const editCategory = (id) => {
  const monthSelect = document.getElementById("monthSelect");
  const categoryNameSelect = document.getElementById("categoryNameSelect");
  const categoryLimitInput = document.getElementById("categoryLimitInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const warning = document.getElementById("categoryWarning");

  if (
    !monthSelect ||
    !categoryNameSelect ||
    !categoryLimitInput ||
    !addCategoryBtn ||
    !warning
  )
    return;

  const month = monthSelect.value || getCurrentMonth();
  const categories = getCategories(month);
  const category = categories.find((item) => {
    return Number(item.id) === Number(id);
  });
  if (!category) {
    return;
  }

  categoryNameSelect.value = category.name;
  categoryLimitInput.value = String(category.budget || "");
  addCategoryBtn.textContent = "Cập nhật danh mục";
  warning.textContent = "";
  editingId = Number(id);
};

// Xóa category có xác nhận và cập nhật lại giao diện.
const deleteCategory = (id) => {
  const monthSelect = document.getElementById("monthSelect");
  if (!monthSelect) {
    return;
  }

  const month = monthSelect.value || getCurrentMonth();

  Swal.fire({
    title: "Bạn có chắc muốn xóa danh mục này?",
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

    const categories = getCategories(month).filter((item) => {
      return Number(item.id) !== Number(id);
    });

    saveCategories(month, categories);

    if (Number(editingId) === Number(id)) {
      resetForm();
    }

    renderCategories();
  });
};

// Tính tổng đã chi của tháng để phục vụ phần ngân sách còn lại.
const getSpentByMonth = (month) => {
  const transactions = getTransactions();
  return transactions
    .filter((item) => {
      return String(item.createdDate || "").startsWith(month);
    })
    .reduce((total, item) => {
      return total + Number(item.total || 0);
    }, 0);
};

// Hiển thị số tiền còn lại của tháng đang chọn.
const renderRemainingBudget = () => {
  const monthSelect = document.getElementById("monthSelect");
  const remainingText = document.getElementById("remainingText");
  if (!monthSelect || !remainingText) {
    return;
  }

  const month = monthSelect.value;
  if (!month) {
    remainingText.textContent = formatVnd(0);
    return;
  }

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[month] || 0);
  const spentAmount = getSpentByMonth(month);
  const remainingAmount = budgetAmount - spentAmount;

  remainingText.textContent = formatVnd(remainingAmount);
};

// Auth guard + thông tin user hiện tại.
const getCurrentUser = () => {
  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }

  const users = getData("users", []);
  return (
    users.find((u) => {
      return String(u.id) === String(userId);
    }) || null
  );
};

const requireLogin = () => {
  if (!getCurrentUserId()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
};

// Header account: hiển thị user, toggle menu và xử lý logout.
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

// Đồng bộ tháng làm việc giữa trang category và các trang khác.
const initMonthSync = () => {
  const monthSelect = document.getElementById("monthSelect");
  if (!monthSelect) {
    return;
  }

  monthSelect.value = getSelectedBudgetMonth() || getCurrentMonth();
  saveSelectedBudgetMonth(monthSelect.value);

  monthSelect.addEventListener("change", () => {
    saveSelectedBudgetMonth(monthSelect.value || getCurrentMonth());
    resetForm();
    renderRemainingBudget();
    renderCategories();
  });

  renderRemainingBudget();
};

// Gắn sự kiện CRUD category và xử lý click action trên card.
const initCategoryCrud = () => {
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const categoryGrid = document.getElementById("categoryGrid");

  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", handleSubmitForm);
  }

  if (categoryGrid) {
    categoryGrid.addEventListener("click", (event) => {
      const actionBtn = event.target.closest("button[data-action]");
      if (!actionBtn) {
        return;
      }

      const action = actionBtn.dataset.action;
      const id = Number(actionBtn.dataset.id);

      if (action === "edit") {
        editCategory(id);
      }
      if (action === "delete") {
        deleteCategory(id);
      }
    });
  }

  renderCategories();
};

// Entry point của trang category.
const init = () => {
  if (!requireLogin()) {
    return;
  }

  initAccountDropdown();
  initMonthSync();
  initCategoryCrud();
};

document.addEventListener("DOMContentLoaded", init);
