const sampleMessages = [
  "HDFC Bank: Rs. 1240.00 debited from A/c XX4212 via UPI to ZOMATO on 04-May. Avl bal Rs. 42,880.",
  "ICICI Bank: Rs 799 spent on your Credit Card ending 9032 at NETFLIX on 05-May.",
  "SBI UPI: You paid Rs. 2850 to BIGBASKET from A/c X1122. UPI Ref 471992.",
  "Axis Bank: Rs. 18000 credited to your salary account XX7711. Available balance Rs. 65000.",
  "Paytm: Paid Rs 460 to Uber Trip via wallet. Txn ID 27A901.",
  "ALERT: Your KYC is blocked. Click http://kyc-fast-verify.example and share OTP to reactivate account.",
  "Congratulations, you won Rs. 50000 cashback. Send UPI PIN to claim reward immediately.",
  "HDFC Bank: Rs. 3200 withdrawn from ATM card ending 4212 on 06-May."
];

const defaultState = {
  settings: {
    budget: 30000,
    goal: 8000,
    income: 55000,
    nextMonthBudget: 30000,
    rewardPoints: 0,
    lastRule: "No rule applied yet"
  },
  messages: sampleMessages.map((text, index) => ({
    id: crypto.randomUUID(),
    text,
    createdAt: new Date(Date.now() - (sampleMessages.length - index) * 3600000).toISOString()
  }))
};

let state = loadState();

const els = {
  spentAmount: document.querySelector("#spentAmount"),
  budgetUsage: document.querySelector("#budgetUsage"),
  budgetLeft: document.querySelector("#budgetLeft"),
  nextBudget: document.querySelector("#nextBudget"),
  rewardPoints: document.querySelector("#rewardPoints"),
  rewardStatus: document.querySelector("#rewardStatus"),
  dangerCount: document.querySelector("#dangerCount"),
  budgetProgress: document.querySelector("#budgetProgress"),
  budgetLimitLabel: document.querySelector("#budgetLimitLabel"),
  burnRatePill: document.querySelector("#burnRatePill"),
  alertList: document.querySelector("#alertList"),
  ruleCopy: document.querySelector("#ruleCopy"),
  smsInput: document.querySelector("#smsInput"),
  smsFeed: document.querySelector("#smsFeed"),
  smsCount: document.querySelector("#smsCount"),
  transactionList: document.querySelector("#transactionList"),
  budgetInput: document.querySelector("#budgetInput"),
  goalInput: document.querySelector("#goalInput"),
  incomeInput: document.querySelector("#incomeInput"),
  investList: document.querySelector("#investList"),
  categoryChart: document.querySelector("#categoryChart")
};

document.querySelector("#scanSmsButton").addEventListener("click", addSms);
document.querySelector("#loadSampleButton").addEventListener("click", loadSample);
document.querySelector("#budgetForm").addEventListener("submit", saveBudgetRules);
document.querySelector("#applyRuleButton").addEventListener("click", applyMonthEndRule);
document.querySelector("#resetDemoButton").addEventListener("click", resetDemo);

render();

function loadState() {
  const saved = localStorage.getItem("smart-expense-tracker");
  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem("smart-expense-tracker", JSON.stringify(state));
}

function parseSms(message) {
  const text = message.text;
  const lower = text.toLowerCase();
  const riskWords = ["kyc", "blocked", "otp", "pin", "click", "http", "won", "claim", "reactivate", "password"];
  const dangerHits = riskWords.filter((word) => lower.includes(word));
  const amountMatch = text.match(/(?:rs\.?|inr|rs)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0;

  const isCredit = /\b(credited|received|refund|cashback received|salary)\b/i.test(text);
  const isDebit = /\b(debited|spent|paid|withdrawn|purchase|sent)\b/i.test(text) && !isCredit;
  const category = categorize(lower);
  const merchant = extractMerchant(text, category);
  const isDanger = dangerHits.length >= 2 || (dangerHits.includes("otp") && dangerHits.includes("pin"));

  return {
    ...message,
    amount,
    type: isCredit ? "credit" : isDebit ? "debit" : "info",
    category,
    merchant,
    isDanger,
    dangerHits
  };
}

function categorize(lower) {
  const rules = [
    ["Food", ["zomato", "swiggy", "restaurant", "cafe", "bigbasket", "grocery"]],
    ["Travel", ["uber", "ola", "metro", "irctc", "fuel", "petrol"]],
    ["Entertainment", ["netflix", "prime", "spotify", "bookmyshow"]],
    ["Shopping", ["amazon", "flipkart", "myntra", "store"]],
    ["Cash", ["atm", "withdrawn"]],
    ["Income", ["salary", "credited"]],
    ["Security", ["otp", "kyc", "blocked", "pin", "claim"]]
  ];

  const match = rules.find(([, words]) => words.some((word) => lower.includes(word)));
  return match ? match[0] : "General";
}

function extractMerchant(text, category) {
  const atMatch = text.match(/\bat\s+([A-Z0-9 ._-]{2,24})/i);
  const toMatch = text.match(/\bto\s+([A-Z0-9 ._-]{2,24})/i);
  const fromMatch = text.match(/\bfrom\s+([A-Z0-9 ._-]{2,24})/i);
  const raw = atMatch?.[1] || toMatch?.[1] || fromMatch?.[1] || category;
  return raw.replace(/\s+(on|via|from|upi|card).*$/i, "").trim();
}

function getParsedMessages() {
  return state.messages.map(parseSms).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTransactions() {
  return getParsedMessages().filter((sms) => sms.amount > 0 && sms.type !== "info" && !sms.isDanger);
}

function getExpenseTotal() {
  return getTransactions()
    .filter((transaction) => transaction.type === "debit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function addSms() {
  const text = els.smsInput.value.trim();
  if (!text) {
    els.smsInput.focus();
    return;
  }

  state.messages.unshift({
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString()
  });
  els.smsInput.value = "";
  saveState();
  render();
}

function loadSample() {
  const examples = [
    "Kotak Bank: Rs. 1899 debited from A/c XX1102 via UPI to AMAZON PAY on 06-May.",
    "Your account will be suspended. Click http://bank-secure-now.example and share OTP for KYC.",
    "SBI Card: Rs 320 credited as refund from MYNTRA on 06-May."
  ];
  els.smsInput.value = examples[Math.floor(Math.random() * examples.length)];
  els.smsInput.focus();
}

function saveBudgetRules(event) {
  event.preventDefault();
  state.settings.budget = normalizeMoney(els.budgetInput.value, state.settings.budget);
  state.settings.goal = normalizeMoney(els.goalInput.value, state.settings.goal);
  state.settings.income = normalizeMoney(els.incomeInput.value, state.settings.income);
  state.settings.nextMonthBudget = state.settings.budget;
  saveState();
  render();
}

function normalizeMoney(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function applyMonthEndRule() {
  const spent = getExpenseTotal();
  const { budget } = state.settings;
  const difference = budget - spent;

  if (difference >= 0) {
    const points = Math.max(50, Math.round(difference / 100));
    const boost = Math.min(500, Math.round(difference * 0.15));
    state.settings.rewardPoints += points;
    state.settings.nextMonthBudget = budget + boost;
    state.settings.lastRule = `Under budget by ${formatMoney(difference)}. Earned ${points} points and ${formatMoney(boost)} budget boost.`;
  } else {
    const overspend = Math.abs(difference);
    const deduction = Math.min(2500, Math.round(overspend * 0.3));
    state.settings.nextMonthBudget = Math.max(1000, budget - deduction);
    state.settings.lastRule = `Overspent by ${formatMoney(overspend)}. ${formatMoney(deduction)} deducted from next month's budget.`;
  }

  saveState();
  render();
}

function resetDemo() {
  state = structuredClone(defaultState);
  saveState();
  render();
}

function render() {
  const parsed = getParsedMessages();
  const transactions = getTransactions();
  const spent = getExpenseTotal();
  const { budget, goal, income, nextMonthBudget, rewardPoints, lastRule } = state.settings;
  const left = budget - spent;
  const usage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const dangerMessages = parsed.filter((sms) => sms.isDanger);

  els.spentAmount.textContent = formatMoney(spent);
  els.budgetUsage.textContent = `${usage}% of budget used`;
  els.budgetLeft.textContent = formatMoney(left);
  els.nextBudget.textContent = `Next month: ${formatMoney(nextMonthBudget)}`;
  els.rewardPoints.textContent = rewardPoints.toLocaleString("en-IN");
  els.rewardStatus.textContent = lastRule;
  els.dangerCount.textContent = dangerMessages.length;
  els.budgetProgress.style.width = `${Math.min(100, usage)}%`;
  els.budgetLimitLabel.textContent = `${formatMoney(budget)} budget`;
  els.ruleCopy.textContent = lastRule;
  els.smsCount.textContent = `${parsed.length} messages`;

  els.budgetInput.value = budget;
  els.goalInput.value = goal;
  els.incomeInput.value = income;

  renderBurnRate(usage);
  renderAlerts({ spent, budget, left, goal, income, dangerMessages });
  renderSmsFeed(parsed);
  renderTransactions(transactions);
  renderInvestments({ spent, budget, goal, income });
  renderCategories(transactions);
}

function renderBurnRate(usage) {
  els.burnRatePill.classList.remove("warning", "danger");

  if (usage >= 100) {
    els.burnRatePill.textContent = "Over budget";
    els.burnRatePill.classList.add("danger");
  } else if (usage >= 80) {
    els.burnRatePill.textContent = "Watch spend";
    els.burnRatePill.classList.add("warning");
  } else {
    els.burnRatePill.textContent = "Healthy";
  }
}

function renderAlerts({ spent, budget, left, goal, income, dangerMessages }) {
  const alerts = [];
  const surplus = income - spent - goal;

  if (dangerMessages.length) {
    alerts.push({
      type: "danger",
      text: `${dangerMessages.length} risky SMS found. Do not share OTP, UPI PIN, or card details from these messages.`
    });
  }

  if (spent > budget) {
    alerts.push({
      type: "danger",
      text: `Overspending alert: you are ${formatMoney(Math.abs(left))} above this month's budget.`
    });
  } else if (spent > budget * 0.8) {
    alerts.push({
      type: "warning",
      text: `Budget caution: only ${formatMoney(left)} remains. Reduce non-essential spending.`
    });
  } else {
    alerts.push({
      type: "safe",
      text: `Good pace: ${formatMoney(left)} remains before you hit your monthly budget.`
    });
  }

  if (surplus < 0) {
    alerts.push({
      type: "warning",
      text: `Savings goal risk: current spend leaves you short by ${formatMoney(Math.abs(surplus))}.`
    });
  }

  els.alertList.innerHTML = alerts
    .map((alert) => `<div class="alert-item ${alert.type}">${alert.text}</div>`)
    .join("");
}

function renderSmsFeed(messages) {
  els.smsFeed.innerHTML = messages
    .map((sms) => {
      const tags = [
        sms.isDanger ? `<span class="tag danger">Danger</span>` : `<span class="tag">Clean</span>`,
        sms.type !== "info" ? `<span class="tag ${sms.type}">${titleCase(sms.type)}</span>` : `<span class="tag">Info</span>`,
        `<span class="tag">${sms.category}</span>`
      ];

      if (sms.dangerHits.length) {
        tags.push(`<span class="tag danger">${sms.dangerHits.slice(0, 3).join(", ")}</span>`);
      }

      return `
        <article class="sms-item">
          <div class="sms-topline">
            <strong>${sms.amount ? formatMoney(sms.amount) : "No amount"}</strong>
            <span>${formatDate(sms.createdAt)}</span>
          </div>
          <p>${escapeHtml(sms.text)}</p>
          <div class="tag-row">${tags.join("")}</div>
        </article>
      `;
    })
    .join("");
}

function renderTransactions(transactions) {
  if (!transactions.length) {
    els.transactionList.innerHTML = `<div class="empty-state">No clean transactions detected yet.</div>`;
    return;
  }

  els.transactionList.innerHTML = transactions
    .map((transaction) => `
      <article class="transaction-item">
        <div class="transaction-topline">
          <strong>${transaction.merchant || transaction.category}</strong>
          <span class="tag ${transaction.type}">${transaction.type === "credit" ? "+" : "-"} ${formatMoney(transaction.amount)}</span>
        </div>
        <p>${transaction.category} from SMS received ${formatDate(transaction.createdAt)}</p>
      </article>
    `)
    .join("");
}

function renderInvestments({ spent, budget, goal, income }) {
  const surplus = Math.max(0, income - spent - goal);
  const sip = Math.max(500, Math.floor(surplus * 0.45 / 500) * 500);
  const emergency = Math.max(0, Math.floor(income * 0.1 / 500) * 500);
  const budgetStatus = spent <= budget ? "Since spending is under control, you can automate the surplus." : "Pause new risky investments until spending returns below budget.";

  const suggestions = [
    {
      title: "Monthly SIP",
      text: `${budgetStatus} Suggested starter SIP: ${formatMoney(sip)} in a diversified mutual fund.`
    },
    {
      title: "Emergency Buffer",
      text: `Move around ${formatMoney(emergency)} each month into a liquid fund or high-interest savings account before lifestyle spending.`
    },
    {
      title: "Rule of 50-30-20",
      text: `Keep needs near 50%, wants near 30%, and saving or investing near 20% of income. Current savings target is ${formatMoney(goal)}.`
    },
    {
      title: "Security Habit",
      text: "Never act on investment, cashback, KYC, OTP, or UPI PIN requests from SMS links. Open the official bank app instead."
    }
  ];

  els.investList.innerHTML = suggestions
    .map((item) => `
      <article class="invest-item">
        <strong>${item.title}</strong>
        <p>${item.text}</p>
      </article>
    `)
    .join("");
}

function renderCategories(transactions) {
  const debitTransactions = transactions.filter((transaction) => transaction.type === "debit");
  const totals = debitTransactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {});

  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0);

  if (!total) {
    els.categoryChart.innerHTML = `<div class="empty-state">Category chart appears after debit SMS messages are detected.</div>`;
    return;
  }

  els.categoryChart.innerHTML = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => {
      const percent = Math.round((amount / total) * 100);
      return `
        <div class="category-row">
          <strong>${category}</strong>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width: ${percent}%"></div>
          </div>
          <span>${formatMoney(amount)}</span>
        </div>
      `;
    })
    .join("");
}

function formatMoney(amount) {
  const rounded = Math.round(amount);
  return `Rs. ${rounded.toLocaleString("en-IN")}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
