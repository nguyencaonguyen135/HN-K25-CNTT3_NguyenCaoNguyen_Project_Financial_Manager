const adminById = (id) => document.getElementById(id);

const initAdminMenuActive = () => {
  const currentPage = document.body.dataset.adminPage || "dashboard";
  const menuItems = document.querySelectorAll(".menu-item[data-menu]");

  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.menu === currentPage);
  });
};

const initAdminSignOut = () => {
  const signOutBtn = adminById("signOutBtn");
  if (!signOutBtn) return;

  signOutBtn.addEventListener("click", () => {
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
};

document.addEventListener("DOMContentLoaded", () => {
  initAdminMenuActive();
  initAdminSignOut();
});
