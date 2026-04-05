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

const getData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const getUsers = () => getData("users", users);

const saveUsers = (users) =>
  localStorage.setItem("users", JSON.stringify(users));

// Lưu dữ liệu gốc lần đầu
if (!localStorage.getItem("users")) saveUsers(users);

const getCurrentUser = () => {
  const users = getUsers();
  const id =
    localStorage.getItem("currentUser") ||
    localStorage.getItem("currentUserId");
  return users.find((u) => String(u.id) === String(id));
};

const getCurrentUserId = () =>
  localStorage.getItem("currentUser") ||
  localStorage.getItem("currentUserId") ||
  "guest";

const getUserScopedKey = (baseKey) => `${baseKey}_${getCurrentUserId()}`;
const LEGACY_FINANCE_MIGRATION_DONE_KEY = "legacyFinanceMigratedOnce_v1";

const isLegacyMigrationDone = () =>
  localStorage.getItem(LEGACY_FINANCE_MIGRATION_DONE_KEY) === "1";

const markLegacyMigrationDone = () =>
  localStorage.setItem(LEGACY_FINANCE_MIGRATION_DONE_KEY, "1");

const migrateLegacyFinanceData = () => {
  const shouldUseLegacyData = !isLegacyMigrationDone();

  const migrateJsonKey = (baseKey, fallback) => {
    const scopedKey = getUserScopedKey(baseKey);
    if (localStorage.getItem(scopedKey)) return;

    if (!shouldUseLegacyData) {
      localStorage.setItem(scopedKey, JSON.stringify(fallback));
      return;
    }

    const legacyValue = localStorage.getItem(baseKey);
    if (!legacyValue) {
      localStorage.setItem(scopedKey, JSON.stringify(fallback));
      return;
    }

    try {
      localStorage.setItem(scopedKey, JSON.stringify(JSON.parse(legacyValue)));
    } catch {
      localStorage.setItem(scopedKey, JSON.stringify(fallback));
    }
  };

  const migrateStringKey = (baseKey) => {
    const scopedKey = getUserScopedKey(baseKey);
    if (localStorage.getItem(scopedKey)) return;

    if (!shouldUseLegacyData) return;

    const legacyValue = localStorage.getItem(baseKey);
    if (!legacyValue) return;

    localStorage.setItem(scopedKey, legacyValue);
  };

  migrateJsonKey("budgets", {});
  migrateJsonKey("remainingBudgets", {});
  migrateJsonKey("transactions", []);
  migrateStringKey("selectedBudgetMonth");
  markLegacyMigrationDone();
};

let currentUser = getCurrentUser();

if (!currentUser) {
  window.location.href = "login.html";
}

migrateLegacyFinanceData();

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

setSidebarActiveByPage();

const currentUserName = document.getElementById("currentUserName");
const accountInfoName = document.getElementById("accountInfoName");
const accountInfoEmail = document.getElementById("accountInfoEmail");
const accountInfoRole = document.getElementById("accountInfoRole");

if (currentUserName) currentUserName.textContent = "Tài khoản";

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
    "Vai trò: " + (currentUser && currentUser.role ? currentUser.role : "user");
}

const toggleBtn = document.getElementById("accountToggle");
const account = document.getElementById("account");

if (toggleBtn && account) {
  toggleBtn.onclick = (e) => {
    e.stopPropagation();
    account.classList.toggle("open");
  };

  document.onclick = (e) => {
    if (!account.contains(e.target)) {
      account.classList.remove("open");
    }
  };
}

const menuLogoutBtn = document.getElementById("menuLogout");
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
        localStorage.removeItem("currentUserId");
        window.location.href = "login.html";
      }
    });
  });
}

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const genderInput = document.getElementById("gender");

const renderProfile = () => {
  if (!nameInput || !emailInput || !phoneInput || !genderInput || !currentUser)
    return;

  nameInput.value = currentUser.fullName;
  emailInput.value = currentUser.email;
  phoneInput.value = currentUser.phone;
  genderInput.value = currentUser.gender ? "Nam" : "Nữ";
};

renderProfile();

const updateBtn = document.querySelector(".btn-change-info");

const changePasswordBtn = document.querySelector(".btn-change-password");
const changePasswordModal = document.getElementById("changePasswordModal");
const cpCloseBtn = document.getElementById("cpCloseBtn");
const cpCancelBtn = document.getElementById("cpCancelBtn");
const cpSaveBtn = document.getElementById("cpSaveBtn");
const oldPasswordInput = document.getElementById("oldPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const oldPasswordError = document.getElementById("oldPasswordError");
const newPasswordError = document.getElementById("newPasswordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

const clearChangePasswordErrors = () => {
  if (oldPasswordError) oldPasswordError.textContent = "";
  if (newPasswordError) newPasswordError.textContent = "";
  if (confirmPasswordError) confirmPasswordError.textContent = "";
};

const openChangePasswordModal = () => {
  if (!changePasswordModal) return;
  clearChangePasswordErrors();
  if (oldPasswordInput) oldPasswordInput.value = "";
  if (newPasswordInput) newPasswordInput.value = "";
  if (confirmPasswordInput) confirmPasswordInput.value = "";
  changePasswordModal.classList.add("show");
};

const closeChangePasswordModal = () => {
  if (!changePasswordModal) return;
  clearChangePasswordErrors();
  if (oldPasswordInput) oldPasswordInput.value = "";
  if (newPasswordInput) newPasswordInput.value = "";
  if (confirmPasswordInput) confirmPasswordInput.value = "";
  changePasswordModal.classList.remove("show");
};

const validateChangePassword = () => {
  clearChangePasswordErrors();

  const oldPassword = String(oldPasswordInput?.value || "").trim();
  const newPassword = String(newPasswordInput?.value || "").trim();
  const confirmPassword = String(confirmPasswordInput?.value || "").trim();

  let isValid = true;

  if (!oldPassword) {
    if (oldPasswordError) oldPasswordError.textContent = "Không được để trống";
    isValid = false;
  }

  if (!newPassword) {
    if (newPasswordError) newPasswordError.textContent = "Không được để trống";
    isValid = false;
  }

  if (!confirmPassword) {
    if (confirmPasswordError)
      confirmPasswordError.textContent = "Không được để trống";
    isValid = false;
  }

  if (!isValid) {
    return { isValid: false };
  }

  if (btoa(oldPassword) !== String(currentUser?.password || "")) {
    if (oldPasswordError)
      oldPasswordError.textContent = "Mật khẩu cũ không đúng";
    return { isValid: false };
  }

  if (newPassword.length < 6) {
    if (newPasswordError)
      newPasswordError.textContent = "Mật khẩu phải ít nhất 6 ký tự";
    return { isValid: false };
  }

  if (newPassword !== confirmPassword) {
    if (confirmPasswordError)
      confirmPasswordError.textContent = "Xác nhận mật khẩu không khớp";
    return { isValid: false };
  }

  return {
    isValid: true,
    newPassword,
  };
};

const handleChangePassword = () => {
  const validation = validateChangePassword();
  if (!validation.isValid) return;

  const users = getUsers();
  const userIndex = users.findIndex(
    (u) => String(u.id) === String(currentUser?.id),
  );

  if (userIndex < 0) return;

  users[userIndex].password = btoa(validation.newPassword);
  saveUsers(users);

  currentUser = users[userIndex];
  localStorage.setItem("currentUser", String(currentUser.id));

  Swal.fire("Thành công", "Đổi mật khẩu thành công", "success");
  closeChangePasswordModal();
};

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", openChangePasswordModal);
}

if (cpCloseBtn) {
  cpCloseBtn.addEventListener("click", closeChangePasswordModal);
}

if (cpCancelBtn) {
  cpCancelBtn.addEventListener("click", closeChangePasswordModal);
}

if (cpSaveBtn) {
  cpSaveBtn.addEventListener("click", handleChangePassword);
}

if (changePasswordModal) {
  changePasswordModal.addEventListener("click", (e) => {
    if (e.target === changePasswordModal) {
      closeChangePasswordModal();
    }
  });
}

if (updateBtn) {
  updateBtn.addEventListener("click", () => {
    if (!nameInput || !emailInput || !phoneInput || !genderInput) return;

    const users = getUsers();
    const newEmail = emailInput.value.trim().toLowerCase();

    const isEmailDuplicated = users.some(
      (u) =>
        String(u.id) !== String(currentUser.id) &&
        u.email &&
        u.email.trim().toLowerCase() === newEmail,
    );

    if (isEmailDuplicated) {
      Swal.fire({
        title: "Email already exists!",
        text: "Please use a different email.",
        icon: "error",
      });
      return;
    }
    Swal.fire({
      title: "Bạn có muốn thay đổi thông tin không?",
      text: "Bạn sẽ không thể hoàn tác thao tác này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Có, cập nhật",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (!result.isConfirmed) return;

      currentUser.fullName = nameInput.value.trim();
      currentUser.email = emailInput.value.trim();
      currentUser.phone = phoneInput.value.trim();
      currentUser.gender = genderInput.value.toLowerCase() === "nam";

      const index = users.findIndex((u) => u.id === currentUser.id);
      users[index] = currentUser;

      saveUsers(users);

      if (accountInfoName) {
        accountInfoName.textContent = currentUser.fullName;
      }
      if (accountInfoEmail) {
        accountInfoEmail.textContent = currentUser.email;
      }
      Swal.fire({
        title: "Cập nhật thành công!",
        text: "Thông tin đã được cập nhật",
        icon: "success",
      });
    });
  });
}

// Lấy object ngân sách các tháng
const getBudgets = () => {
  return getData(getUserScopedKey("budgets"), {});
};

// Lấy object tiền còn lại các tháng
const getRemainingBudgets = () => {
  return getData(getUserScopedKey("remainingBudgets"), {});
};

// Lấy danh sách giao dịch chi tiêu
const getTransactions = () => {
  return getData(getUserScopedKey("transactions"), []);
};

// Lấy tháng đang được chọn trước đó
const getSelectedBudgetMonth = () => {
  return localStorage.getItem(getUserScopedKey("selectedBudgetMonth"));
};

/* ==========================================================
   2. HÀM LƯU DỮ LIỆU VÀO LOCALSTORAGE
========================================================== */

// Lưu ngân sách
const saveBudgets = (data) => {
  localStorage.setItem(getUserScopedKey("budgets"), JSON.stringify(data));
};

// Lưu tiền còn lại
const saveRemainingBudgets = (data) => {
  localStorage.setItem(
    getUserScopedKey("remainingBudgets"),
    JSON.stringify(data),
  );
};

// Lưu tháng đang chọn
const saveSelectedBudgetMonth = (month) => {
  localStorage.setItem(getUserScopedKey("selectedBudgetMonth"), month);
};

/* ==========================================================
   3. HÀM XỬ LÝ TIỀN
========================================================== */

// Chuyển input tiền (có thể chứa ký tự) → number
const parseMoneyInput = (value) =>
  Number(String(value || "").replace(/[^\d]/g, ""));

// Format tiền hiển thị kiểu VN
const formatVnd = (money) =>
  Number(money || 0).toLocaleString("vi-VN") + " VND";

/* ==========================================================
   4. TÍNH TỔNG TIỀN ĐÃ CHI TRONG THÁNG
========================================================== */

const getSpentByMonth = (month) => {
  const transactions = getTransactions();

  // Lọc giao dịch theo tháng
  const filteredTransactions = transactions.filter((item) =>
    String(item.createdDate || "").startsWith(month),
  );

  // Tính tổng tiền các giao dịch đã lọc
  const totalSpent = filteredTransactions.reduce(
    (total, item) => total + Number(item.total || 0),
    0,
  );
  return totalSpent;
};

/* ==========================================================
   5. LƯU TIỀN CÒN LẠI THEO THÁNG
========================================================== */

const saveRemainingByMonth = (month, remainingAmount) => {
  const remainingBudgets = getRemainingBudgets();

  // lưu remaining theo key tháng
  remainingBudgets[month] = Number(remainingAmount || 0);

  saveRemainingBudgets(remainingBudgets);
};

/* ==========================================================
   6. LẤY ELEMENT DOM
========================================================== */

const monthInput = document.getElementById("monthSelect");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const remainingText = document.getElementById("remainingText");

const resetBudgetForm = () => {
  if (!budgetInput) return;
  budgetInput.value = "";
};

/* ==========================================================
   7. RENDER SỐ TIỀN CÒN LẠI MỖI THÁNG
========================================================== */

const renderMonthlyBalance = () => {
  // nếu thiếu element thì dừng
  if (!monthInput || !budgetInput || !remainingText) return;

  // mặc định luôn hiển thị 0 VND cho tài khoản chưa có dữ liệu
  remainingText.textContent = formatVnd(0);

  const month = monthInput.value;
  if (!month) {
    budgetInput.value = "";
    return;
  }

  // lấy ngân sách tháng
  const budgets = getBudgets();
  const budgetAmount = Number(budgets[month] || 0);

  // tính tiền đã chi
  const spentAmount = getSpentByMonth(month);

  // tính tiền còn lại
  const remainingAmount = budgetAmount - spentAmount;

  // luôn để trống ô nhập để user nhập mới, không đổ lại dữ liệu cũ
  budgetInput.value = "";

  // hiển thị tiền còn lại
  remainingText.textContent = formatVnd(remainingAmount);

  // lưu remaining vào localStorage
  saveRemainingByMonth(month, remainingAmount);
};

/* ==========================================================
   8. KHỞI TẠO APP
========================================================== */

const initMonthlyBudget = () => {
  // kiểm tra tồn tại element
  if (!monthInput || !budgetInput || !saveBudgetBtn || !remainingText) return;

  // tạo dữ liệu mặc định nếu lần đầu dùng web
  if (!localStorage.getItem(getUserScopedKey("budgets"))) saveBudgets({});
  if (!localStorage.getItem(getUserScopedKey("remainingBudgets")))
    saveRemainingBudgets({});
  if (!localStorage.getItem(getUserScopedKey("transactions"))) {
    localStorage.setItem(getUserScopedKey("transactions"), JSON.stringify([]));
  }

  // set tháng mặc định (ưu tiên tháng đã chọn trước đó)
  monthInput.value =
    getSelectedBudgetMonth() ||
    monthInput.value ||
    new Date().toISOString().slice(0, 7);

  saveSelectedBudgetMonth(monthInput.value);

  /* ========================
     EVENT: CLICK SAVE BUDGET
  ======================== */
  saveBudgetBtn.addEventListener("click", () => {
    const month = monthInput.value;
    const money = parseMoneyInput(budgetInput.value);

    // validate chọn tháng
    if (!month)
      return Swal.fire("Chưa chọn tháng", "Vui lòng chọn tháng", "warning");

    // validate nhập tiền
    if (!budgetInput.value.trim() || money <= 0)
      return Swal.fire(
        "Chưa nhập tiền",
        "Vui lòng nhập ngân sách tháng",
        "warning",
      );

    // lưu ngân sách
    const budgets = getBudgets();
    budgets[month] = money;
    saveBudgets(budgets);
    saveSelectedBudgetMonth(month);

    // tính & hiển thị tiền còn lại
    const spentAmount = getSpentByMonth(month);
    const remainingAmount = money - spentAmount;
    remainingText.textContent = formatVnd(remainingAmount);

    saveRemainingByMonth(month, remainingAmount);

    // reset input để nhập ngân sách mới nhanh hơn
    resetBudgetForm();

    Swal.fire("Thành công", "Đã lưu ngân sách", "success");
  });

  /* ========================
     EVENT: ĐỔI THÁNG
  ======================== */
  monthInput.addEventListener("change", () => {
    saveSelectedBudgetMonth(monthInput.value);
    renderMonthlyBalance();
  });

  // quay lại tab → cập nhật lại số tiền
  window.addEventListener("focus", renderMonthlyBalance);

  renderMonthlyBalance();
};

initMonthlyBudget();
