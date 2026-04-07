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

const getUsers = () => {
  return JSON.parse(localStorage.getItem("users")) || users;
};

const saveUsers = (data) => {
  localStorage.setItem("users", JSON.stringify(data));
};

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const confirmEl = document.getElementById("confirm");
const registerBtnEl = document.getElementById("registerBtn");
const formEl = document.getElementById("registerForm");

const REMEMBER_EMAIL = "rememberEmail";
const REMEMBER_PASSWORD = "rememberPassword";

const saveRemember = (email, password) => {
  localStorage.setItem(REMEMBER_EMAIL, email);
  localStorage.setItem(REMEMBER_PASSWORD, password);
};

const showPopup = (
  message,
  { type = "error", title = "Thông báo", onClose } = {},
) => {
  const durationMs = 1000;

  let overlay = document.getElementById("popupOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "popupOverlay";
    overlay.className = "popup-overlay";
    overlay.innerHTML = `
      <div id="popupBox" class="popup-box">
        <div id="popupTitle" class="popup-title"></div>
        <div id="popupMessage" class="popup-message"></div>
        <button type="button" id="popupCloseBtn" class="popup-close">Đóng</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.__closeNow = null;
    overlay.__popupTimer = null;

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay && typeof overlay.__closeNow === "function")
        overlay.__closeNow();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && typeof overlay.__closeNow === "function")
        overlay.__closeNow();
    });
  }

  const popupBox = document.getElementById("popupBox");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");
  const closeBtn = document.getElementById("popupCloseBtn");

  popupBox.classList.remove("error", "success");
  popupBox.classList.add(type);
  popupTitle.textContent = title;
  popupMessage.textContent = message;

  const closeNow = () => {
    overlay.style.display = "none";
    overlay.__popupTimer = null;
    if (typeof onClose === "function") onClose();
  };
  overlay.__closeNow = closeNow;

  if (closeBtn) closeBtn.onclick = closeNow;

  overlay.style.display = "flex";
  if (overlay.__popupTimer) clearTimeout(overlay.__popupTimer);
  overlay.__popupTimer = window.setTimeout(() => {
    if (typeof overlay.__closeNow === "function") overlay.__closeNow();
  }, durationMs);
};

const register = (e) => {
  e.preventDefault();

  const email = emailEl.value.trim();
  const password = passwordEl.value.trim();
  const confirm = confirmEl.value.trim();


  if (!email || !password || !confirm) {
    return showPopup("Vui lòng điền đầy đủ thông tin", {
      type: "error",
      title: "Đăng ký thất bại",
    });
  }

  if (!email.includes("@") || !email.includes(".")) {
    return showPopup("Email không hợp lệ", {
      type: "error",
      title: "Đăng ký thất bại",
    });
  }

  if (password.length < 6) {
    return showPopup("Mật khẩu >= 6 ký tự", {
      type: "error",
      title: "Đăng ký thất bại",
    });
  }

  if (password !== confirm) {
    return showPopup("Mật khẩu không khớp", {
      type: "error",
      title: "Đăng ký thất bại",
    });
  }

  const users = getUsers();

  const isExist = users.some((user) => {
    return user.email === email;
  });
  if (isExist) {
    return showPopup("Email đã tồn tại", {
      type: "error",
      title: "Đăng ký thất bại",
    });
  }

  const newUser = {
    id: Date.now(),
    email,
    password: password,
    role: "user",
    status: true,
  };

  users.push(newUser);
  saveUsers(users);
  saveRemember(email, password);

  showPopup("Đăng ký thành công", {
    type: "success",
    title: "Thành công",
    onClose: () => (window.location.href = "login.html"),
  });
};

if (registerBtnEl) {
  registerBtnEl.addEventListener("click", register);
}

if (formEl) {
  formEl.addEventListener("submit", register);
}





























// // Cách 2
// const emailInput = document.getElementById("email");
// const passwordInput = document.getElementById("password");
// const confirmInput = document.getElementById("confirm");
// const btn = document.getElementById("registerBtn");

// const emailError = document.getElementById("emailError");
// const passwordError = document.getElementById("passwordError");
// const confirmError = document.getElementById("confirmError");
// const successMsg = document.getElementById("successMsg");

// // lấy danh sách user từ localStorage
// const getUsers = () => JSON.parse(localStorage.getItem("users")) || [];
// const saveUsers = (users) =>
//   localStorage.setItem("users", JSON.stringify(users));

// // reset lỗi
// const clearError = () => {
//   emailError.textContent = "";
//   passwordError.textContent = "";
//   confirmError.textContent = "";
//   successMsg.textContent = "";

//   emailInput.classList.remove("input-error");
//   passwordInput.classList.remove("input-error");
//   confirmInput.classList.remove("input-error");
// };

// // kiểm tra email
// const isValidEmail = (email) => {
//   return email.includes("@") && email.includes(".");
// };

// btn.addEventListener("click", () => {
//   clearError();

//   const email = emailInput.value.trim();
//   const password = passwordInput.value.trim();
//   const confirm = confirmInput.value.trim();

//   let isValid = true;

//   // validate email
//   if (email === "") {
//     emailError.textContent = "Please enter your email ...";
//     emailInput.classList.add("input-error");
//     isValid = false;
//   } else if (!isValidEmail(email)) {
//     emailError.textContent = "Email is not correct format";
//     emailInput.classList.add("input-error");
//     isValid = false;
//   }

//   // validate password
//   if (password === "") {
//     passwordError.textContent = "Please enter your password ...";
//     passwordInput.classList.add("input-error");
//     isValid = false;
//   } else if (password.length < 6) {
//     passwordError.textContent = "Password must be ≥ 6 characters";
//     passwordInput.classList.add("input-error");
//     isValid = false;
//   }

//   // validate confirm
//   if (confirm === "") {
//     confirmError.textContent = "Please enter confirm password ...";
//     confirmInput.classList.add("input-error");
//     isValid = false;
//   } else if (confirm !== password) {
//     confirmError.textContent = "Confirm password not match";
//     confirmInput.classList.add("input-error");
//     isValid = false;
//   }

//   if (!isValid) return;

//   // kiểm tra email đã tồn tại
//   const users = getUsers();
//   const isExist = users.some((user) => user.email === email);

//   if (isExist) {
//     emailError.textContent = "Email already exists";
//     emailInput.classList.add("input-error");
//     return;
//   }

//   // tạo user mới
//   const newUser = {
//     id: Date.now(),
//     email,
//     password,
//   };

//   users.push(newUser);
//   saveUsers(users);

//   // hiện thông báo thành công
//   successMsg.textContent = "Sign Up Successfully";

//   // reset form
//   emailInput.value = "";
//   passwordInput.value = "";
//   confirmInput.value = "";

//   // sau 1 giây chuyển sang login
//   setTimeout(() => {
//     window.location.href = "login.html";
//   }, 1000);
// });
