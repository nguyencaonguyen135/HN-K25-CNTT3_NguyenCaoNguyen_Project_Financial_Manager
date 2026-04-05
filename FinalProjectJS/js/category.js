const byId = (id) => document.getElementById(id);

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
  null;

const getUserScopedKey = (baseKey) => `${baseKey}_${getCurrentUserId()}`;

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const getSelectedBudgetMonth = () =>
  localStorage.getItem(getUserScopedKey("selectedBudgetMonth"));

const saveSelectedBudgetMonth = (month) =>
  localStorage.setItem(getUserScopedKey("selectedBudgetMonth"), month);

const formatVnd = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

// ===== Du lieu theo user =====
const getBudgets = () => getData(getUserScopedKey("budgets"), {});
const getTransactions = () => getData(getUserScopedKey("transactions"), []);
const getMonthlyCategories = () =>
  getData(getUserScopedKey("monthlyCategories"), []);
const saveMonthlyCategories = (data) =>
  setData(getUserScopedKey("monthlyCategories"), data);

let editingId = null;

const getMonthRecord = (month) => {
  const monthly = getMonthlyCategories();
  return monthly.find((m) => m.month === month) || null;
};

const ensureMonthRecord = (month) => {
  const monthly = getMonthlyCategories();
  let monthObj = monthly.find((m) => m.month === month);

  if (!monthObj) {
    monthObj = { id: Date.now(), month, categories: [] };
    monthly.push(monthObj);
    saveMonthlyCategories(monthly);
  }

  return monthObj;
};

const getSpentByCategoryMap = (month) => {
  const transactions = getTransactions();
  const map = new Map();

  transactions
    .filter((t) => String(t.createdDate || "").startsWith(month))
    .forEach((t) => {
      const categoryId = Number(t.categoryId);
      const amount = Number(t.total || 0);
      if (!categoryId) return;
      map.set(categoryId, (map.get(categoryId) || 0) + amount);
    });

  return map;
};

const syncMonthSpent = (month) => {
  const monthly = getMonthlyCategories();
  const monthObj = monthly.find((m) => m.month === month);
  if (!monthObj) return;

  const spentMap = getSpentByCategoryMap(month);
  let changed = false;

  monthObj.categories.forEach((cat) => {
    const nextSpent = spentMap.get(Number(cat.id)) || 0;
    if (Number(cat.spent || 0) !== nextSpent) {
      cat.spent = nextSpent;
      changed = true;
    }
  });

  if (changed) saveMonthlyCategories(monthly);
};

const getCategories = (month) => {
  const monthObj = getMonthRecord(month);
  return monthObj?.categories || [];
};

const saveCategories = (month, categories) => {
  const monthly = getMonthlyCategories();
  const monthObj = monthly.find((m) => m.month === month);

  if (!monthObj) {
    monthly.push({ id: Date.now(), month, categories });
  } else {
    monthObj.categories = categories;
  }

  saveMonthlyCategories(monthly);
};

const renderCategories = () => {
  const grid = byId("categoryGrid");
  const warning = byId("categoryWarning");
  const monthSelect = byId("monthSelect");

  if (!grid || !warning || !monthSelect) return;

  const month = monthSelect.value || getCurrentMonth();

  // Cap nhat spent theo giao dich moi nhat
  syncMonthSpent(month);

  const categories = getCategories(month);

  if (categories.length === 0) {
    grid.innerHTML =
      '<p class="empty">Chưa có danh mục nào trong tháng này.</p>';
    warning.textContent = "";
    return;
  }

  const hasOver = categories.some(
    (cat) => Number(cat.spent || 0) > Number(cat.budget || 0),
  );
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

const resetForm = () => {
  const categoryNameSelect = byId("categoryNameSelect");
  const categoryLimitInput = byId("categoryLimitInput");
  const addCategoryBtn = byId("addCategoryBtn");
  const warning = byId("categoryWarning");

  if (categoryNameSelect) categoryNameSelect.value = "";
  if (categoryLimitInput) categoryLimitInput.value = "";
  if (addCategoryBtn) addCategoryBtn.textContent = "Thêm danh mục";
  if (warning) warning.textContent = "";

  editingId = null;
};

const handleSubmitForm = () => {
  const monthSelect = byId("monthSelect");
  const categoryNameSelect = byId("categoryNameSelect");
  const categoryLimitInput = byId("categoryLimitInput");
  const warning = byId("categoryWarning");

  if (!monthSelect || !categoryNameSelect || !categoryLimitInput || !warning)
    return;

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

    const target = categories.find(
      (item) => Number(item.id) === Number(editingId),
    );
    if (!target) return;

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

  const duplicated = categories.some(
    (item) => String(item.name).toLowerCase() === name.toLowerCase(),
  );

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

const editCategory = (id) => {
  const monthSelect = byId("monthSelect");
  const categoryNameSelect = byId("categoryNameSelect");
  const categoryLimitInput = byId("categoryLimitInput");
  const addCategoryBtn = byId("addCategoryBtn");
  const warning = byId("categoryWarning");

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
  const category = categories.find((item) => Number(item.id) === Number(id));
  if (!category) return;

  categoryNameSelect.value = category.name;
  categoryLimitInput.value = String(category.budget || "");
  addCategoryBtn.textContent = "Cập nhật danh mục";
  warning.textContent = "";
  editingId = Number(id);
};

const deleteCategory = (id) => {
  const monthSelect = byId("monthSelect");
  if (!monthSelect) return;

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
    if (!result.isConfirmed) return;

    const categories = getCategories(month).filter(
      (item) => Number(item.id) !== Number(id),
    );

    saveCategories(month, categories);

    if (Number(editingId) === Number(id)) {
      resetForm();
    }

    renderCategories();
  });
};

const getSpentByMonth = (month) => {
  const transactions = getTransactions();
  return transactions
    .filter((item) => String(item.createdDate || "").startsWith(month))
    .reduce((total, item) => total + Number(item.total || 0), 0);
};

const renderRemainingBudget = () => {
  const monthSelect = byId("monthSelect");
  const remainingText = byId("remainingText");
  if (!monthSelect || !remainingText) return;

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

const getCurrentUser = () => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const users = getData("users", []);
  return users.find((u) => String(u.id) === String(userId)) || null;
};

const requireLogin = () => {
  if (!getCurrentUserId()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
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

const initMonthSync = () => {
  const monthSelect = byId("monthSelect");
  if (!monthSelect) return;

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

const initCategoryCrud = () => {
  const addCategoryBtn = byId("addCategoryBtn");
  const categoryGrid = byId("categoryGrid");

  addCategoryBtn?.addEventListener("click", handleSubmitForm);

  categoryGrid?.addEventListener("click", (event) => {
    const actionBtn = event.target.closest("button[data-action]");
    if (!actionBtn) return;

    const action = actionBtn.dataset.action;
    const id = Number(actionBtn.dataset.id);

    if (action === "edit") editCategory(id);
    if (action === "delete") deleteCategory(id);
  });

  renderCategories();
};

const init = () => {
  if (!requireLogin()) return;

  initAccountDropdown();
  initMonthSync();
  initCategoryCrud();
};

document.addEventListener("DOMContentLoaded", init);
