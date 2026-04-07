const store = window.StorageService.createLegacyStorage();

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

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("users")) || defaultUsers;
  } catch {
    return defaultUsers;
  }
};

const renderUserKpi = () => {
  const totalEl = byId("kpiUserTotal");
  const deltaEl = byId("kpiUserDelta");
  if (!totalEl || !deltaEl) return;

  const users = getUsers().filter((u) => u.role !== "admin");
  const total = users.length;
  const active = users.filter((u) => Boolean(u.status)).length;
  const inactive = total - active;

  totalEl.textContent = total.toLocaleString("vi-VN");
  deltaEl.textContent = `Active ${active} | Inactive ${inactive}`;
  deltaEl.classList.remove("up", "down");
  deltaEl.classList.add(inactive > 0 ? "down" : "up");
};

const chartSeries = {
  "12m": {
    labels: [
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
    ],
    main: [26, 29, 31, 38, 45, 47, 50, 54, 66, 72, 78, 84],
    alt: [22, 24, 28, 30, 33, 36, 35, 37, 41, 44, 46, 49],
  },
  "6m": {
    labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    main: [50, 54, 66, 72, 78, 84],
    alt: [35, 37, 41, 44, 46, 49],
  },
  "30d": {
    labels: ["W1", "W2", "W3", "W4"],
    main: [62, 70, 67, 84],
    alt: [41, 44, 46, 49],
  },
  "7d": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    main: [9, 12, 10, 14, 13, 16, 18],
    alt: [7, 9, 8, 10, 11, 12, 13],
  },
};

const initMenuState = () => {
  const menuItems = document.querySelectorAll(".menu-item[data-menu]");
  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      menuItems.forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
    });
  });
};

const initChart = () => {
  const canvas = byId("financeChart");
  if (!canvas) return null;

  const startData = chartSeries["12m"];

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: startData.labels,
      datasets: [
        {
          label: "Spending",
          data: startData.main,
          borderColor: "#5c5dff",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.45,
          fill: true,
          backgroundColor: "rgba(92, 93, 255, 0.12)",
        },
        {
          label: "Forecast",
          data: startData.alt,
          borderColor: "#8f9bff",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.45,
          fill: false,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#83889b", font: { weight: 700 } },
        },
        y: {
          display: false,
          grid: { color: "rgba(152, 160, 190, 0.15)" },
        },
      },
    },
  });

  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const period = btn.dataset.period;
      const data = chartSeries[period];
      if (!data) return;

      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.main;
      chart.data.datasets[1].data = data.alt;
      chart.update();
    });
  });

  return chart;
};

initMenuState();
initChart();
renderUserKpi();

window.addEventListener("storage", (event) => {
  if (event.key === "users") renderUserKpi();
});

window.setInterval(renderUserKpi, 2000);
