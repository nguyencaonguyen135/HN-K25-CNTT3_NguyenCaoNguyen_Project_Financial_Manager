const STORAGE_KEY = "financeApp";

const getData = (key, fallback) => {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
};

const getFinanceStore = () => getData(STORAGE_KEY, {});
const getUsers = () => getData("users", []);

const getCurrentUserId = () => {
  return localStorage.getItem("currentUser") || "guest";
};

const getUserScopedKey = (baseKey) => `${baseKey}_${getCurrentUserId()}`;
const getSelectedMonthKey = () => `selectedReportMonth_${getCurrentUserId()}`;

const getCurrentMonth = () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${mm}`;
};

const getPreviousMonth = (month) => {
  const [yearText, monthText] = String(month).split("-");
  const year = Number(yearText);
  const mm = Number(monthText);
  if (!year || !mm) return getCurrentMonth();
  if (mm === 1) return `${year - 1}-12`;
  return `${year}-${String(mm - 1).padStart(2, "0")}`;
};

const formatVnd = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;
const formatVndShort = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getTransactions = () => {
  const store = getFinanceStore();
  if (Array.isArray(store.transactions)) return store.transactions;

  const scoped = getData(getUserScopedKey("transactions"), null);
  if (Array.isArray(scoped)) return scoped;

  return getData("transactions", []);
};

const getBudgets = () => {
  const store = getFinanceStore();
  if (store.budgets && typeof store.budgets === "object") return store.budgets;

  const scoped = getData(getUserScopedKey("budgets"), null);
  if (scoped && typeof scoped === "object") return scoped;

  return getData("budgets", {});
};

const getRemainingBudgets = () => {
  const store = getFinanceStore();
  if (store.remainingBudgets && typeof store.remainingBudgets === "object")
    return store.remainingBudgets;

  const scoped = getData(getUserScopedKey("remainingBudgets"), null);
  if (scoped && typeof scoped === "object") return scoped;

  return getData("remainingBudgets", {});
};

const getCategories = () => {
  const store = getFinanceStore();
  if (Array.isArray(store.categories)) return store.categories;

  const monthly = getData(
    getUserScopedKey("monthlyCategories"),
    getData("monthlyCategories", []),
  );
  if (!Array.isArray(monthly)) return [];

  const map = new Map();
  monthly.forEach((monthObj) => {
    (monthObj.categories || []).forEach((cat) => {
      map.set(Number(cat.id), {
        id: Number(cat.id),
        name: cat.name || `Danh mục ${cat.id}`,
      });
    });
  });

  return Array.from(map.values());
};

const getCategoryNameMap = () => {
  const map = new Map();
  getCategories().forEach((cat) => map.set(Number(cat.id), cat.name));
  return map;
};

const getSelectedMonth = () => {
  return localStorage.getItem(getSelectedMonthKey()) || getCurrentMonth();
};

const setSelectedMonth = (month) => {
  localStorage.setItem(getSelectedMonthKey(), month);
};

const getAvailableMonths = () => {
  const monthSet = new Set([getCurrentMonth()]);

  getTransactions().forEach((item) => {
    const monthText = String(item.createdDate || "").slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(monthText)) monthSet.add(monthText);
  });

  Object.keys(getBudgets()).forEach((month) => {
    if (/^\d{4}-\d{2}$/.test(month)) monthSet.add(month);
  });

  Object.keys(getRemainingBudgets()).forEach((month) => {
    if (/^\d{4}-\d{2}$/.test(month)) monthSet.add(month);
  });

  return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
};

const getTransactionsByMonth = (month) => {
  return getTransactions().filter((item) =>
    String(item.createdDate || "").startsWith(month),
  );
};

const calculateMonthlySummary = (month) => {
  const rows = getTransactionsByMonth(month);
  const totalSpent = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const budget = Number(getBudgets()[month] || 0);

  const usedCategoryCount = new Set(
    rows
      .map((row) => Number(row.categoryId))
      .filter((id) => Number.isFinite(id) && id > 0),
  ).size;

  return {
    month,
    totalSpent,
    budget,
    transactionCount: rows.length,
    usedCategoryCount,
  };
};

const calculateMonthComparison = (month) => {
  const previousMonth = getPreviousMonth(month);
  const current = getTransactionsByMonth(month).reduce(
    (sum, row) => sum + Number(row.total || 0),
    0,
  );
  const previous = getTransactionsByMonth(previousMonth).reduce(
    (sum, row) => sum + Number(row.total || 0),
    0,
  );

  let percentChange = 0;
  if (previous === 0) {
    percentChange = current > 0 ? 100 : 0;
  } else {
    percentChange = ((current - previous) / previous) * 100;
  }

  return { month, previousMonth, current, previous, percentChange };
};

const calculateForecast = (month) => {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const mm = Number(monthText);
  const totalSpent = getTransactionsByMonth(month).reduce(
    (sum, row) => sum + Number(row.total || 0),
    0,
  );
  const budget = Number(getBudgets()[month] || 0);
  const daysInMonth = new Date(year, mm, 0).getDate();

  const now = new Date();
  const isCurrentMonth = month === getCurrentMonth();
  const currentDay = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;

  const avgPerDay = totalSpent / currentDay;
  const forecast = avgPerDay * daysInMonth;

  return {
    month,
    avgPerDay,
    forecast,
    willOverBudget: budget > 0 && forecast > budget,
  };
};

const calculateSpendingByCategory = (month) => {
  const rows = getTransactionsByMonth(month);
  const categoryMap = getCategoryNameMap();
  const spendMap = new Map();

  rows.forEach((row) => {
    const categoryId = Number(row.categoryId);
    const amount = Number(row.total || 0);
    const name =
      categoryMap.get(categoryId) ||
      (categoryId ? `Danh mục ${categoryId}` : "Khác");

    if (!spendMap.has(name)) spendMap.set(name, 0);
    spendMap.set(name, spendMap.get(name) + amount);
  });

  const total = Array.from(spendMap.values()).reduce(
    (sum, value) => sum + value,
    0,
  );
  const items = Array.from(spendMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      percent: total ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { total, items };
};

const getTopCategories = (month, limit = 3) => {
  return calculateSpendingByCategory(month).items.slice(0, limit);
};

const getHighestSpendingDay = (month) => {
  const rows = getTransactionsByMonth(month);
  const dayMap = new Map();

  rows.forEach((row) => {
    const dayText = String(row.createdDate || "").slice(0, 10);
    const amount = Number(row.total || 0);
    if (!dayText) return;
    dayMap.set(dayText, (dayMap.get(dayText) || 0) + amount);
  });

  let date = "";
  let amount = 0;
  dayMap.forEach((total, dayText) => {
    if (total > amount) {
      amount = total;
      date = dayText;
    }
  });

  return { date, amount };
};

const getTopTransactions = (month, limit = 5) => {
  const categoryMap = getCategoryNameMap();
  return getTransactionsByMonth(month)
    .map((row) => ({
      createdDate: String(row.createdDate || ""),
      categoryName: categoryMap.get(Number(row.categoryId)) || "Khác",
      total: Number(row.total || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

const calculateNoSpendStreak = (month) => {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const mm = Number(monthText);
  const now = new Date();
  const isCurrentMonth = month === getCurrentMonth();
  const daysInMonth = new Date(year, mm, 0).getDate();
  const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;

  const spendDays = new Set(
    getTransactionsByMonth(month)
      .map((row) => Number(String(row.createdDate || "").slice(8, 10)))
      .filter((day) => Number.isFinite(day) && day > 0),
  );

  let currentStreak = 0;
  for (let day = lastDay; day >= 1; day -= 1) {
    if (spendDays.has(day)) break;
    currentStreak += 1;
  }

  let bestStreak = 0;
  let tmp = 0;
  for (let day = 1; day <= lastDay; day += 1) {
    if (spendDays.has(day)) {
      tmp = 0;
    } else {
      tmp += 1;
      if (tmp > bestStreak) bestStreak = tmp;
    }
  }

  return { currentStreak, bestStreak };
};

const calculateFinancialScore = (month) => {
  const summary = calculateMonthlySummary(month);
  const streak = calculateNoSpendStreak(month);

  let score = 0;
  if (summary.totalSpent <= summary.budget) score += 40;
  if (summary.budget > 0 && summary.totalSpent < summary.budget * 0.8)
    score += 20;
  if (streak.currentStreak > 3 || streak.bestStreak > 3) score += 20;
  if (summary.transactionCount < 30) score += 20;

  return Math.max(0, Math.min(100, score));
};

const renderMonthOptions = () => {
  const monthFilter = document.getElementById("monthFilter");
  if (!monthFilter) return;

  const options = getAvailableMonths();
  monthFilter.innerHTML = options
    .map((month) => `<option value="${month}">${month}</option>`)
    .join("");

  const selected = getSelectedMonth();
  monthFilter.value = options.includes(selected)
    ? selected
    : options[0] || getCurrentMonth();
  setSelectedMonth(monthFilter.value);
};

const renderSummary = (summary) => {
  const totalSpentEl = document.getElementById("totalSpentValue");
  const budgetEl = document.getElementById("budgetValue");
  const transactionCountEl = document.getElementById("transactionCountValue");
  const usedCategoryCountEl = document.getElementById("usedCategoryCountValue");

  if (totalSpentEl) totalSpentEl.textContent = formatVnd(summary.totalSpent);
  if (budgetEl) budgetEl.textContent = formatVnd(summary.budget);
  if (transactionCountEl)
    transactionCountEl.textContent = String(summary.transactionCount);
  if (usedCategoryCountEl)
    usedCategoryCountEl.textContent = String(summary.usedCategoryCount);
};

const renderComparison = (data) => {
  const previousEl = document.getElementById("comparisonPrevious");
  const currentEl = document.getElementById("comparisonCurrent");
  const changeEl = document.getElementById("comparisonChange");

  if (previousEl)
    previousEl.textContent = `Tháng trước: ${formatVnd(data.previous)}`;
  if (currentEl)
    currentEl.textContent = `Tháng này: ${formatVnd(data.current)}`;

  if (!changeEl) return;
  changeEl.classList.remove("up", "down", "neutral");

  if (data.current === data.previous) {
    changeEl.textContent = "Không thay đổi";
    changeEl.classList.add("neutral");
    return;
  }

  const pct = Math.abs(Math.round(data.percentChange));
  if (data.current > data.previous) {
    changeEl.textContent = `↑ Tăng ${pct}%`;
    changeEl.classList.add("up");
  } else {
    changeEl.textContent = `↓ Giảm ${pct}%`;
    changeEl.classList.add("down");
  }
};

const renderForecast = (forecast) => {
  const forecastEl = document.getElementById("forecastValue");
  const riskEl = document.getElementById("forecastRisk");

  if (forecastEl)
    forecastEl.textContent = `Dự đoán cuối tháng: ${formatVnd(forecast.forecast)}`;
  if (riskEl)
    riskEl.textContent = `Nguy cơ vượt ngân sách: ${forecast.willOverBudget ? "Có" : "Không"}`;
};

const PIE_COLORS = [
  "#3b82f6",
  "#0ea5e9",
  "#14b8a6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const renderCategoryPie = (spendingData) => {
  const canvas = document.getElementById("categoryPieChart");
  const legend = document.getElementById("categoryLegend");
  if (!canvas || !legend) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  legend.innerHTML = "";

  if (!spendingData.items.length || spendingData.total <= 0) {
    ctx.fillStyle = "#64748b";
    ctx.font = "16px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("Chưa có dữ liệu", canvas.width / 2, canvas.height / 2);
    return;
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 14;

  let startAngle = -Math.PI / 2;
  spendingData.items.forEach((item, index) => {
    const color = PIE_COLORS[index % PIE_COLORS.length];
    const angle = (item.amount / spendingData.total) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += angle;

    legend.innerHTML += `
      <li>
        <span class="legend-dot" style="background:${color}"></span>
        <span>${item.name}: ${formatVnd(item.amount)}</span>
      </li>
    `;
  });
};

const renderTopCategories = (topCategories) => {
  const container = document.getElementById("topCategoriesList");
  if (!container) return;

  if (!topCategories.length) {
    container.innerHTML = "<p>Chưa có dữ liệu danh mục.</p>";
    return;
  }

  container.innerHTML = topCategories
    .map(
      (item) => `
      <div class="top-category-item">
        <div class="top-category-head">
          <span>${item.name}</span>
          <span>${formatVnd(item.amount)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(item.percent, 100).toFixed(1)}%"></div>
        </div>
      </div>
    `,
    )
    .join("");
};

const renderHighestDay = (highestDay) => {
  const dateEl = document.getElementById("highestDayDate");
  const amountEl = document.getElementById("highestDayAmount");

  if (!highestDay.date) {
    if (dateEl) dateEl.textContent = "Ngày tiêu nhiều nhất: Chưa có dữ liệu";
    if (amountEl) amountEl.textContent = "Số tiền: 0đ";
    return;
  }

  const [year, month, day] = highestDay.date.split("-");
  if (dateEl)
    dateEl.textContent = `Ngày tiêu nhiều nhất: ${day}/${month}/${year}`;
  if (amountEl)
    amountEl.textContent = `Số tiền: ${formatVndShort(highestDay.amount)}`;
};

const renderTopTransactions = (rows) => {
  const body = document.getElementById("topTransactionsBody");
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="3">Chưa có giao dịch.</td></tr>';
    return;
  }

  body.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${row.createdDate}</td>
        <td>${row.categoryName}</td>
        <td>${formatVnd(row.total)}</td>
      </tr>
    `,
    )
    .join("");
};

const renderNoSpendStreak = (streak) => {
  const currentEl = document.getElementById("currentStreakText");
  const bestEl = document.getElementById("bestStreakText");

  if (currentEl)
    currentEl.textContent = `Bạn đã ${streak.currentStreak} ngày không chi tiêu`;
  if (bestEl) bestEl.textContent = `Kỷ lục: ${streak.bestStreak} ngày`;
};

const renderInsights = (month) => {
  const list = document.getElementById("insightList");
  if (!list) return;

  const summary = calculateMonthlySummary(month);
  const forecast = calculateForecast(month);
  const categoryData = calculateSpendingByCategory(month);

  const alerts = [];

  if (summary.budget > 0 && summary.totalSpent >= summary.budget * 0.8) {
    alerts.push("Bạn đã dùng hơn 80% ngân sách tháng.");
  }

  if (forecast.willOverBudget) {
    alerts.push("Dự đoán cuối tháng có nguy cơ vượt ngân sách.");
  }

  const eatingCategory = categoryData.items.find((item) => {
    const name = String(item.name || "").toLowerCase();
    return (
      name.includes("ăn") ||
      name.includes("uong") ||
      name.includes("uống") ||
      name.includes("food")
    );
  });

  if (eatingCategory && eatingCategory.percent > 40) {
    alerts.push("Chi tiêu ăn uống đang vượt 40% tổng chi tháng.");
  }

  if (!alerts.length) {
    alerts.push("Tình hình tài chính tháng này đang ổn định.");
  }

  list.innerHTML = alerts.map((alert) => `<li>${alert}</li>`).join("");
};

const renderFinancialScore = (month) => {
  const score = calculateFinancialScore(month);
  const scoreEl = document.getElementById("financialScoreText");
  if (scoreEl) scoreEl.textContent = `${score}/100 ⭐`;
};

const renderDashboard = () => {
  const month = getSelectedMonth();

  const summary = calculateMonthlySummary(month);
  const comparison = calculateMonthComparison(month);
  const forecast = calculateForecast(month);
  const categoryData = calculateSpendingByCategory(month);
  const topCategories = getTopCategories(month);
  const highestDay = getHighestSpendingDay(month);
  const topTransactions = getTopTransactions(month);
  const streak = calculateNoSpendStreak(month);

  renderSummary(summary);
  renderComparison(comparison);
  renderForecast(forecast);
  renderCategoryPie(categoryData);
  renderTopCategories(topCategories);
  renderHighestDay(highestDay);
  renderTopTransactions(topTransactions);
  renderNoSpendStreak(streak);
  renderInsights(month);
  renderFinancialScore(month);
};

const initAccountDropdown = () => {
  const accountEl = document.getElementById("account");
  const accountToggle = document.getElementById("accountToggle");
  const menuLogoutBtn = document.getElementById("menuLogout");

  const currentUserName = document.getElementById("currentUserName");
  const accountInfoName = document.getElementById("accountInfoName");
  const accountInfoEmail = document.getElementById("accountInfoEmail");
  const accountInfoRole = document.getElementById("accountInfoRole");

  const userId = getCurrentUserId();
  if (userId === "guest") {
    window.location.href = "login.html";
    return false;
  }

  const user = getUsers().find((u) => String(u.id) === String(userId));

  if (currentUserName) currentUserName.textContent = "Tài khoản";
  if (accountInfoName) accountInfoName.textContent = user?.fullName || "-";
  if (accountInfoEmail) accountInfoEmail.textContent = user?.email || "-";
  if (accountInfoRole)
    accountInfoRole.textContent = `Vai trò: ${user?.role || "user"}`;

  if (accountEl && accountToggle) {
    accountToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      accountEl.classList.toggle("open");
    });

    document.addEventListener("click", () =>
      accountEl.classList.remove("open"),
    );
  }

  if (menuLogoutBtn) {
    menuLogoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });
  }

  return true;
};

const initMonthFilter = () => {
  const monthFilter = document.getElementById("monthFilter");
  if (!monthFilter) return;

  renderMonthOptions();

  monthFilter.addEventListener("change", () => {
    setSelectedMonth(monthFilter.value || getCurrentMonth());
    renderDashboard();
  });
};

const init = () => {
  if (!initAccountDropdown()) return;
  initMonthFilter();
  renderDashboard();
};

document.addEventListener("DOMContentLoaded", init);
