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
const loginBtnEl = document.getElementById("loginBtn");
const formEl = document.getElementById("loginForm");
const rememberEl = document.getElementById("rememberMe");

const REMEMBER_EMAIL_KEY = "rememberEmail";
const REMEMBER_PASSWORD_KEY = "rememberPassword";

const loadRemember = () => {
  const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
  const rememberedPassword = localStorage.getItem(REMEMBER_PASSWORD_KEY);

  if (!rememberedEmail || !rememberedPassword) return;
  if (!emailEl || !passwordEl) return;

  emailEl.value = rememberedEmail;
  passwordEl.value = rememberedPassword;

  if (rememberEl) rememberEl.checked = true;
};

loadRemember();

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

const login = (e) => {
  e.preventDefault();

  const emailValue = emailEl.value.trim();
  const passwordValue = passwordEl.value.trim();

  if (!emailValue || !passwordValue) {
    return showPopup("Vui lòng điền đầy đủ thông tin", {
      type: "error",
      title: "Đăng nhập thất bại",
    });
  }

  const users = getUsers();
  const user = users.find((u) => {
    return u.email === emailValue;
  });

  if (!user || user.password !== passwordValue) {
    return showPopup("Sai email hoặc mật khẩu", {
      type: "error",
      title: "Đăng nhập thất bại",
    });
  }

  // lưu user đang đăng nhập
  localStorage.setItem("currentUser", user.id);

  if (rememberEl && rememberEl.checked) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, emailValue);
    localStorage.setItem(REMEMBER_PASSWORD_KEY, passwordValue);
  } else {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    localStorage.removeItem(REMEMBER_PASSWORD_KEY);
  }

  // phân quyền
  if (user.role === "admin") {
    showPopup("Đăng nhập thành công 🎉", {
      type: "success",
      title: "Chào Admin",
      onClose: () => (window.location.href = "../pages/admin.html"),
    });
  } else {
    showPopup("Đăng nhập thành công 🎉", {
      type: "success",
      title: "Chào User",
      onClose: () => (window.location.href = "../pages/index.html"),
    });
  }
};

if (loginBtnEl) {
  loginBtnEl.addEventListener("click", login);
}
if (formEl) {
  formEl.addEventListener("submit", login);
}





































// const users = [
//   {
//     id: 1,
//     fullName: "Nguyen Van A",
//     email: "nguyenvana@gmail.com",
//     password: btoa("123456"),
//     role: "user",
//   },
//   {
//     id: 2,
//     fullName: "admin",
//     email: "admin@gmail.com",
//     password: btoa("123456"),
//     role: "admin",
//   },
//   {
//     id: 3,
//     fullName: "Pham Thi B",
//     email: "phamthib@gmail.com",
//     password: btoa("123456"),
//     role: "user",
//   },
// ];

// const getUsers = () => JSON.parse(localStorage.getItem("users")) || users;

// // ===== DOM =====
// const emailEl = document.getElementById("email");
// const passwordEl = document.getElementById("password");
// const loginBtn = document.getElementById("loginBtn");
// const rememberEl = document.getElementById("rememberMe");

// const emailError = document.getElementById("emailError");
// const passwordError = document.getElementById("passwordError");
// const successMsg = document.getElementById("successMsg");

// const REMEMBER_EMAIL_KEY = "rememberEmail";
// const REMEMBER_PASSWORD_KEY = "rememberPassword";

// // ===== LOAD REMEMBER =====
// const loadRemember = () => {
//   const email = localStorage.getItem(REMEMBER_EMAIL_KEY);
//   const pass = localStorage.getItem(REMEMBER_PASSWORD_KEY);

//   if (!email || !pass) return;

//   emailEl.value = email;
//   passwordEl.value = pass;
//   rememberEl.checked = true;
// };
// loadRemember();

// // ===== CLEAR ERROR =====
// const clearError = () => {
//   emailError.textContent = "";
//   passwordError.textContent = "";
//   successMsg.textContent = "";

//   emailEl.classList.remove("input-error");
//   passwordEl.classList.remove("input-error");
// };

// // ===== CHECK EMAIL =====
// const isValidEmail = (email) => email.includes("@") && email.includes(".");

// // decode password đã btoa
// const decodePassword = (pass) => {
//   try { return atob(pass); }
//   catch { return pass; }
// };

// // ===== LOGIN =====
// loginBtn.addEventListener("click", () => {
//   clearError();

//   const email = emailEl.value.trim();
//   const password = passwordEl.value.trim();
//   let isValid = true;

//   // validate email
//   if (email === "") {
//     emailError.textContent = "Please enter your email ...";
//     emailEl.classList.add("input-error");
//     isValid = false;
//   } else if (!isValidEmail(email)) {
//     emailError.textContent = "Email is not correct format";
//     emailEl.classList.add("input-error");
//     isValid = false;
//   }

//   // validate password
//   if (password === "") {
//     passwordError.textContent = "Please enter your password ...";
//     passwordEl.classList.add("input-error");
//     isValid = false;
//   }

//   if (!isValid) return;

//   // tìm user
//   const users = getUsers();
//   const user = users.find(u => u.email === email);

//   if (!user || decodePassword(user.password) !== password) {
//     passwordError.textContent = "Email or password incorrect";
//     passwordEl.classList.add("input-error");
//     return;
//   }

//   // lưu user login
//   localStorage.setItem("currentUser", user.id);

//   // remember me
//   if (rememberEl.checked) {
//     localStorage.setItem(REMEMBER_EMAIL_KEY, email);
//     localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
//   } else {
//     localStorage.removeItem(REMEMBER_EMAIL_KEY);
//     localStorage.removeItem(REMEMBER_PASSWORD_KEY);
//   }

//   // login success
//   successMsg.textContent = "Login Successfully";

//   // phân quyền
//   setTimeout(() => {
//     if (user.role === "admin") {
//       window.location.href = "../pages/admin.html";
//     } else {
//       window.location.href = "../pages/index.html";
//     }
//   }, 1000);
// });
