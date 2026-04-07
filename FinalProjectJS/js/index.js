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

// Đọc/ghi dữ liệu và lấy thông tin user hiện tại.
const getData = (key, fallback) => {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
};

const getUsers = () => {
  return getData("users", users);
};

const saveUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

if (!localStorage.getItem("users")) {
  saveUsers(users);
}

const getCurrentUser = () => {
  const users = getUsers();
  const id = localStorage.getItem("currentUser");
  return users.find((u) => String(u.id) === String(id));
};

const getCurrentUserId = () => localStorage.getItem("currentUser") || "guest";

const getUserScopedKey = (baseKey) => `${baseKey}_${getCurrentUserId()}`;

// Khởi tạo dữ liệu tài chính theo từng user khi đăng nhập lần đầu.
const initScopedFinanceData = () => {
  const ensureJsonKey = (baseKey, fallback) => {
    const scopedKey = getUserScopedKey(baseKey);
    if (localStorage.getItem(scopedKey)) {
      return;
    }
    localStorage.setItem(scopedKey, JSON.stringify(fallback));
  };

  ensureJsonKey("budgets", {});
  ensureJsonKey("remainingBudgets", {});
  ensureJsonKey("transactions", []);
};

let currentUser = getCurrentUser();

if (!currentUser) {
  window.location.href = "login.html";
}

initScopedFinanceData();

// Sidebar: tự động active menu theo trang hiện tại.
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

setSidebarActiveByPage();

// Header account: hiển thị thông tin user và vai trò.
const currentUserName = document.getElementById("currentUserName");
const accountInfoName = document.getElementById("accountInfoName");
const accountInfoEmail = document.getElementById("accountInfoEmail");
const accountInfoRole = document.getElementById("accountInfoRole");

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
    "Vai trò: " + (currentUser && currentUser.role ? currentUser.role : "user");
}

const toggleBtn = document.getElementById("accountToggle");
const account = document.getElementById("account");

// Dropdown account: mở/đóng khi click trong và ngoài vùng account.
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

// Logout: xác nhận trước khi xóa session đăng nhập.
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

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const genderInput = document.getElementById("gender");

// Profile: đổ dữ liệu user hiện tại vào form thông tin cá nhân.
const renderProfile = () => {
  if (
    !nameInput ||
    !emailInput ||
    !phoneInput ||
    !genderInput ||
    !currentUser
  ) {
    return;
  }

  nameInput.value = currentUser.fullName;
  emailInput.value = currentUser.email;
  phoneInput.value = currentUser.phone;
  genderInput.value = currentUser.gender ? "Nam" : "Nữ";
};

renderProfile();

const updateBtn = document.querySelector(".btn-change-info");

// Đổi mật khẩu: lấy các phần tử modal và input liên quan.
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

// Xóa thông báo lỗi trong modal đổi mật khẩu.
const clearChangePasswordErrors = () => {
  if (oldPasswordError) {
    oldPasswordError.textContent = "";
  }
  if (newPasswordError) {
    newPasswordError.textContent = "";
  }
  if (confirmPasswordError) {
    confirmPasswordError.textContent = "";
  }
};

const openChangePasswordModal = () => {
  if (!changePasswordModal) {
    return;
  }
  clearChangePasswordErrors();
  if (oldPasswordInput) {
    oldPasswordInput.value = "";
  }
  if (newPasswordInput) {
    newPasswordInput.value = "";
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.value = "";
  }
  changePasswordModal.classList.add("show");
};

const closeChangePasswordModal = () => {
  if (!changePasswordModal) {
    return;
  }
  clearChangePasswordErrors();
  if (oldPasswordInput) {
    oldPasswordInput.value = "";
  }
  if (newPasswordInput) {
    newPasswordInput.value = "";
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.value = "";
  }
  changePasswordModal.classList.remove("show");
};

// Validate đổi mật khẩu: kiểm tra rỗng, mật khẩu cũ, độ dài và xác nhận.
const validateChangePassword = () => {
  clearChangePasswordErrors();

  const oldPassword = String(
    oldPasswordInput ? oldPasswordInput.value : "",
  ).trim();
  const newPassword = String(
    newPasswordInput ? newPasswordInput.value : "",
  ).trim();
  const confirmPassword = String(
    confirmPasswordInput ? confirmPasswordInput.value : "",
  ).trim();

  let isValid = true;

  if (!oldPassword) {
    if (oldPasswordError) {
      oldPasswordError.textContent = "Không được để trống";
    }
    isValid = false;
  }

  if (!newPassword) {
    if (newPasswordError) {
      newPasswordError.textContent = "Không được để trống";
    }
    isValid = false;
  }

  if (!confirmPassword) {
    if (confirmPasswordError) {
      confirmPasswordError.textContent = "Không được để trống";
    }
    isValid = false;
  }

  if (!isValid) {
    return { isValid: false };
  }

  if (oldPassword !== String(currentUser ? currentUser.password : "")) {
    if (oldPasswordError) {
      oldPasswordError.textContent = "Mật khẩu cũ không đúng";
    }
    return { isValid: false };
  }

  if (newPassword.length < 6) {
    if (newPasswordError) {
      newPasswordError.textContent = "Mật khẩu phải ít nhất 6 ký tự";
    }
    return { isValid: false };
  }

  if (newPassword !== confirmPassword) {
    if (confirmPasswordError) {
      confirmPasswordError.textContent = "Xác nhận mật khẩu không khớp";
    }
    return { isValid: false };
  }

  return {
    isValid: true,
    newPassword,
  };
};

// Cập nhật mật khẩu mới vào danh sách users và localStorage.
const handleChangePassword = () => {
  const validation = validateChangePassword();
  if (!validation.isValid) {
    return;
  }

  const users = getUsers();
  const userIndex = users.findIndex(
    (u) => String(u.id) === String(currentUser ? currentUser.id : ""),
  );

  if (userIndex < 0) {
    return;
  }

  users[userIndex].password = validation.newPassword;
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

const validateProfileForm = () => {
  if (!nameInput || !emailInput || !phoneInput || !genderInput) {
    return { isValid: false };
  }

  const fullName = String(nameInput.value || "").trim();
  const email = String(emailInput.value || "").trim();
  const phone = String(phoneInput.value || "").trim();
  const genderText = String(genderInput.value || "")
    .trim()
    .toLowerCase();

  if (!fullName) {
    Swal.fire("Thiếu thông tin", "Họ và tên không được để trống", "warning");
    return { isValid: false };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Swal.fire(
      "Email không hợp lệ",
      "Vui lòng nhập đúng định dạng email",
      "warning",
    );
    return { isValid: false };
  }

  const phoneRegex = /^0\d{9,10}$/;
  if (!phoneRegex.test(phone)) {
    Swal.fire(
      "Số điện thoại không hợp lệ",
      "Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số",
      "warning",
    );
    return { isValid: false };
  }

  if (genderText !== "nam" && genderText !== "nữ" && genderText !== "nu") {
    Swal.fire(
      "Giới tính không hợp lệ",
      'Vui lòng nhập "Nam" hoặc "Nữ"',
      "warning",
    );
    return { isValid: false };
  }

  return {
    isValid: true,
    fullName,
    email,
    phone,
    isMale: genderText === "nam",
  };
};

// Cập nhật profile: validate email trùng và lưu lại thông tin user.
if (updateBtn) {
  updateBtn.addEventListener("click", () => {
    if (!nameInput || !emailInput || !phoneInput || !genderInput) {
      return;
    }

    const validation = validateProfileForm();
    if (!validation.isValid) {
      return;
    }

    const users = getUsers();
    const newEmail = validation.email.toLowerCase();

    const isEmailDuplicated = users.some(
      (u) =>
        String(u.id) !== String(currentUser.id) &&
        u.email &&
        u.email.trim().toLowerCase() === newEmail,
    );

    if (isEmailDuplicated) {
      Swal.fire({
        title: "Email đã tồn tại rồi!",
        text: "Vui lòng sử dụng email khác.",
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
      if (!result.isConfirmed) {
        return;
      }

      currentUser.fullName = validation.fullName;
      currentUser.email = validation.email;
      currentUser.phone = validation.phone;
      currentUser.gender = validation.isMale;

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
        timer: 1000,
        showConfirmButton: false,
      });
    });
  });
}

// Budget data: đọc/ghi ngân sách, số dư, giao dịch và tháng đang chọn.
const getBudgets = () => {
  return getData(getUserScopedKey("budgets"), {});
};

const getRemainingBudgets = () => {
  return getData(getUserScopedKey("remainingBudgets"), {});
};

const getTransactions = () => {
  return getData(getUserScopedKey("transactions"), []);
};

const getSelectedBudgetMonth = () => {
  return localStorage.getItem(getUserScopedKey("selectedBudgetMonth"));
};

const saveBudgets = (data) => {
  localStorage.setItem(getUserScopedKey("budgets"), JSON.stringify(data));
};

const saveRemainingBudgets = (data) => {
  localStorage.setItem(
    getUserScopedKey("remainingBudgets"),
    JSON.stringify(data),
  );
};

const saveSelectedBudgetMonth = (month) => {
  localStorage.setItem(getUserScopedKey("selectedBudgetMonth"), month);
};

// Money helpers: parse input tiền và format hiển thị VND.
const parseMoneyInput = (value) =>
  Number(String(value || "").replace(/[^\d]/g, ""));

const formatVnd = (money) =>
  Number(money || 0).toLocaleString("vi-VN") + " VND";

// Tính tổng tiền đã chi trong tháng từ danh sách giao dịch.
const getSpentByMonth = (month) => {
  const transactions = getTransactions();

  const filteredTransactions = transactions.filter((item) =>
    String(item.createdDate || "").startsWith(month),
  );

  const totalSpent = filteredTransactions.reduce(
    (total, item) => total + Number(item.total || 0),
    0,
  );
  return totalSpent;
};

// Lưu số dư còn lại theo từng tháng.
const saveRemainingByMonth = (month, remainingAmount) => {
  const remainingBudgets = getRemainingBudgets();

  remainingBudgets[month] = Number(remainingAmount || 0);

  saveRemainingBudgets(remainingBudgets);
};

const monthInput = document.getElementById("monthSelect");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const remainingText = document.getElementById("remainingText");

// Reset input ngân sách sau khi lưu.
const resetBudgetForm = () => {
  if (!budgetInput) {
    return;
  }
  budgetInput.value = "";
};

// Render số dư tháng hiện tại và đồng bộ lại remainingBudgets.
const renderMonthlyBalance = () => {
  if (!monthInput || !budgetInput || !remainingText) {
    return;
  }

  remainingText.textContent = formatVnd(0);

  const month = monthInput.value;
  if (!month) {
    budgetInput.value = "";
    return;
  }

  const budgets = getBudgets();
  const budgetAmount = Number(budgets[month] || 0);

  const spentAmount = getSpentByMonth(month);

  const remainingAmount = budgetAmount - spentAmount;

  budgetInput.value = "";

  remainingText.textContent = formatVnd(remainingAmount);

  saveRemainingByMonth(month, remainingAmount);
};

// Khởi tạo module ngân sách tháng và bind các sự kiện chính.
const initMonthlyBudget = () => {
  if (!monthInput || !budgetInput || !saveBudgetBtn || !remainingText) {
    return;
  }

  if (!localStorage.getItem(getUserScopedKey("budgets"))) {
    saveBudgets({});
  }
  if (!localStorage.getItem(getUserScopedKey("remainingBudgets"))) {
    saveRemainingBudgets({});
  }
  if (!localStorage.getItem(getUserScopedKey("transactions"))) {
    localStorage.setItem(getUserScopedKey("transactions"), JSON.stringify([]));
  }

  monthInput.value =
    getSelectedBudgetMonth() ||
    monthInput.value ||
    new Date().toISOString().slice(0, 7);

  saveSelectedBudgetMonth(monthInput.value);
  saveBudgetBtn.addEventListener("click", () => {
    const month = monthInput.value;
    const money = parseMoneyInput(budgetInput.value);

    if (!month) {
      return Swal.fire("Chưa chọn tháng", "Vui lòng chọn tháng", "warning");
    }

    if (!budgetInput.value.trim() || isNaN(money)) {
      return Swal.fire(
        "Chưa nhập tiền",
        "Vui lòng nhập ngân sách tháng",
        "warning",
      );
    }

    if (budgetInput.value.trim() < 0) {
      return Swal.fire(
        "Tiền không hợp lệ",
        "Vui lòng nhập ngân sách tháng lớn hơn 0",
        "warning",
      );
    }

    const budgets = getBudgets();
    budgets[month] = money;
    saveBudgets(budgets);
    saveSelectedBudgetMonth(month);

    const spentAmount = getSpentByMonth(month);
    const remainingAmount = money - spentAmount;
    remainingText.textContent = formatVnd(remainingAmount);

    saveRemainingByMonth(month, remainingAmount);

    resetBudgetForm();

    Swal.fire({
      title: "Thành công!",
      text: "Ngân sách tháng đã được cập nhật",
      icon: "success",
      timer: 1000,
      showConfirmButton: false,
    });
  });
  monthInput.addEventListener("change", () => {
    saveSelectedBudgetMonth(monthInput.value);
    renderMonthlyBalance();
  });

  window.addEventListener("focus", renderMonthlyBalance);

  renderMonthlyBalance();
};

initMonthlyBudget();
