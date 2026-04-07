const byId = (id) => document.getElementById(id);

const defaultUsers = [
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

const state = {
  keyword: "",
  page: 1,
  pageSize: 8,
  editingId: null,
};

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("users")) || defaultUsers;
  } catch {
    return defaultUsers;
  }
};

const saveUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

const ensureUsers = () => {
  if (!localStorage.getItem("users")) saveUsers(defaultUsers);
};

const getDisplayUsers = () => {
  const keyword = state.keyword.trim().toLowerCase();
  let users = getUsers().filter((u) => u.role !== "admin");

  if (keyword) {
    users = users.filter((u) => {
      const name = String(u.fullName || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      return (
        name.includes(keyword) ||
        email.includes(keyword) ||
        phone.includes(keyword)
      );
    });
  }

  return users;
};

const renderTable = () => {
  const body = byId("usersTableBody");
  const empty = byId("usersEmpty");
  if (!body || !empty) return;

  const rows = getDisplayUsers();
  const totalPage = Math.max(1, Math.ceil(rows.length / state.pageSize));
  if (state.page > totalPage) state.page = totalPage;

  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  empty.hidden = rows.length !== 0;

  body.innerHTML = pageRows
    .map((user, idx) => {
      const stt = start + idx + 1;
      const isActive = Boolean(user.status);
      return `
        <tr>
          <td>${stt}</td>
          <td>${user.fullName || "-"}</td>
          <td>${user.email || "-"}</td>
          <td>${user.phone || "-"}</td>
          <td>${user.gender ? "Male" : "Female"}</td>
          <td>
            <span class="status-pill ${isActive ? "active" : "inactive"}">
              ${isActive ? "Active" : "InActive"}
            </span>
          </td>
          <td>
            <button
              type="button"
              class="btn-mini btn-edit"
              data-action="edit"
              data-id="${user.id}"
            >
              Edit
            </button>
            <button
              type="button"
              class="action-btn ${isActive ? "locked" : "unlocked"}"
              data-action="toggle"
              data-id="${user.id}"
              title="Toggle status"
              aria-label="Toggle status"
            >
              ${isActive ? "🔒" : "🔓"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPagination(rows.length, totalPage);
};

const renderPagination = (totalItems, totalPage) => {
  const pagination = byId("usersPagination");
  if (!pagination) return;

  if (totalItems <= state.pageSize) {
    pagination.innerHTML = "";
    return;
  }

  const buttons = Array.from({ length: totalPage }, (_, i) => {
    const page = i + 1;
    return `<button type="button" class="page-btn ${page === state.page ? "active" : ""}" data-page="${page}">${page}</button>`;
  }).join("");

  pagination.innerHTML = `
    <button type="button" class="page-btn" data-nav="prev" ${state.page === 1 ? "disabled" : ""}>←</button>
    ${buttons}
    <button type="button" class="page-btn" data-nav="next" ${state.page === totalPage ? "disabled" : ""}>→</button>
  `;
};

const toggleStatus = (id) => {
  const users = getUsers();
  const index = users.findIndex((u) => Number(u.id) === Number(id));
  if (index < 0) return;

  users[index].status = !Boolean(users[index].status);
  saveUsers(users);
  renderTable();
};

const openModal = (user) => {
  const overlay = byId("userModalOverlay");
  const fullName = byId("modalFullName");
  const email = byId("modalEmail");
  const phone = byId("modalPhone");
  const gender = byId("modalGender");
  const status = byId("modalStatus");
  if (!overlay || !fullName || !email || !phone || !gender || !status) return;

  state.editingId = Number(user.id);
  fullName.value = user.fullName || "";
  email.value = user.email || "";
  phone.value = user.phone || "";
  gender.value = user.gender ? "male" : "female";
  status.value = user.status ? "active" : "inactive";
  overlay.hidden = false;
};

const closeModal = () => {
  const overlay = byId("userModalOverlay");
  if (overlay) overlay.hidden = true;
};

const saveModal = () => {
  const fullName = byId("modalFullName");
  const email = byId("modalEmail");
  const phone = byId("modalPhone");
  const gender = byId("modalGender");
  const status = byId("modalStatus");

  if (!fullName || !email || !phone || !gender || !status) return;

  const users = getUsers();
  const idx = users.findIndex((u) => Number(u.id) === Number(state.editingId));
  if (idx < 0) return;

  const nameValue = String(fullName.value || "").trim();
  const emailValue = String(email.value || "").trim();
  const phoneValue = String(phone.value || "").trim();

  if (!nameValue || !emailValue) {
    Swal.fire("Thông báo", "Vui lòng nhập đầy đủ tên và email", "warning");
    return;
  }

  users[idx].fullName = nameValue;
  users[idx].email = emailValue;
  users[idx].phone = phoneValue;
  users[idx].gender = gender.value === "male";
  users[idx].status = status.value === "active";

  saveUsers(users);
  closeModal();
  renderTable();
};

const initEvents = () => {
  const searchInput = byId("userSearchInput");
  const body = byId("usersTableBody");
  const pagination = byId("usersPagination");
  const modalClose = byId("userModalClose");
  const modalCancel = byId("userModalCancel");
  const modalSave = byId("userModalSave");
  const modalOverlay = byId("userModalOverlay");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.keyword = searchInput.value || "";
      state.page = 1;
      renderTable();
    });
  }

  if (body) {
    body.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === "toggle") {
        toggleStatus(id);
        return;
      }

      if (action === "edit") {
        const user = getUsers().find((u) => Number(u.id) === Number(id));
        if (!user) return;
        openModal(user);
      }
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalCancel) modalCancel.addEventListener("click", closeModal);
  if (modalSave) modalSave.addEventListener("click", saveModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) closeModal();
    });
  }

  if (pagination) {
    pagination.addEventListener("click", (event) => {
      const btn = event.target.closest("button.page-btn");
      if (!btn) return;

      const nav = btn.dataset.nav;
      if (nav === "prev") {
        state.page = Math.max(1, state.page - 1);
        renderTable();
        return;
      }

      if (nav === "next") {
        const totalPage = Math.max(
          1,
          Math.ceil(getDisplayUsers().length / state.pageSize),
        );
        state.page = Math.min(totalPage, state.page + 1);
        renderTable();
        return;
      }

      const page = Number(btn.dataset.page);
      if (!page) return;
      state.page = page;
      renderTable();
    });
  }
};

const init = () => {
  ensureUsers();
  initEvents();
  renderTable();
};

document.addEventListener("DOMContentLoaded", init);
