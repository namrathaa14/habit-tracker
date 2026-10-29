
const STORAGE_KEY = "habitFlowData";

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitIconInput = document.getElementById("habit-icon");
const habitList = document.getElementById("habit-list");
const emptyState = document.getElementById("empty-state");
const weekDaysContainer = document.getElementById("week-days");

let habits = loadHabits();

function loadHabits() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.filter(
      habit => habit &&
        typeof habit.id === "string" &&
        typeof habit.name === "string" &&
        Array.isArray(habit.completedDates)
    ) : [];
  } catch {
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getToday() {
  return dateKey(new Date());
}

function getWeekDates() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getStreak(habit) {
  const completed = new Set(habit.completedDates);
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  // If today is incomplete, allow the streak
  // to continue from yesterday.
  if (!completed.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (completed.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function renderWeekHeader() {
  weekDaysContainer.replaceChildren();

  getWeekDates().forEach(date => {
    const day = document.createElement("div");
    day.className = "week-day";

    if (dateKey(date) === getToday()) {
      day.classList.add("today");
    }

    const letter = document.createElement("span");
    letter.className = "day-letter";
    letter.textContent = date.toLocaleDateString("en-US", {
      weekday: "short"
    });

    const number = document.createElement("span");
    number.className = "day-number";
    number.textContent = date.getDate();

    day.append(letter, number);
    weekDaysContainer.appendChild(day);
  });
}

function renderHabits() {
  habitList.replaceChildren();

  emptyState.classList.toggle("hidden", habits.length > 0);

  const today = getToday();
  const weekDates = getWeekDates();

  habits.forEach(habit => {
    const row = document.createElement("div");
    row.className = "habit-row";

    // Habit icon and name
    const info = document.createElement("div");
    info.className = "habit-info";

    const icon = document.createElement("span");
    icon.className = "habit-icon";
    icon.textContent = habit.icon || "🌱";

    const details = document.createElement("div");

    const name = document.createElement("p");
    name.className = "habit-name";
    name.textContent = habit.name;

    const subtitle = document.createElement("p");
    subtitle.className = "habit-subtitle";
    subtitle.textContent = `${getStreak(habit)} day streak`;

    details.append(name, subtitle);
    info.append(icon, details);

    // Weekly completion buttons
    const cells = document.createElement("div");
    cells.className = "day-cells";

    weekDates.forEach(date => {
      const key = dateKey(date);
      const completed = habit.completedDates.includes(key);
      const isFuture = key > today;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "day-toggle";
      button.classList.toggle("done", completed);
      button.textContent = completed ? "✓" : "";
      button.disabled = isFuture;

      button.setAttribute(
        "aria-label",
        `${habit.name}, ${formatDate(date)}: ${
          completed ? "completed" : "not completed"
        }`
      );

      if (isFuture) {
        button.title = "You cannot mark a future day";
      } else {
        button.title = completed
          ? "Mark as incomplete"
          : "Mark as complete";

        button.addEventListener("click", () => {
          if (habit.completedDates.includes(key)) {
            habit.completedDates = habit.completedDates.filter(
              item => item !== key
            );
          } else {
            habit.completedDates.push(key);
          }

          saveHabits();
          render();
        });
      }

      cells.appendChild(button);
    });

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "×";
    deleteButton.title = `Delete ${habit.name}`;
    deleteButton.setAttribute("aria-label", `Delete ${habit.name}`);

    deleteButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        `Delete the habit "${habit.name}"?`
      );

      if (confirmed) {
        habits = habits.filter(item => item.id !== habit.id);
        saveHabits();
        render();
      }
    });

    row.append(info, cells, deleteButton);
    habitList.appendChild(row);
  });
}

function renderStats() {
  const today = getToday();

  const completedToday = habits.filter(habit =>
    habit.completedDates.includes(today)
  ).length;

  const percentage = habits.length
    ? Math.round((completedToday / habits.length) * 100)
    : 0;

  document.getElementById("progress-number").textContent =
    `${percentage}%`;

  document.getElementById("progress-bar").style.width =
    `${percentage}%`;

  document.getElementById("completed-count").textContent =
    `${completedToday} / ${habits.length}`;

  document.getElementById("progress-caption").textContent =
    habits.length === 0
      ? "Add your first habit"
      : percentage === 100
        ? "Amazing! All habits completed!"
        : `${habits.length - completedToday} habits left for today`;

  const bestStreak = habits.reduce(
    (max, habit) => Math.max(max, getStreak(habit)),
    0
  );

  document.getElementById("streak-count").textContent =
    `${bestStreak} ${bestStreak === 1 ? "day" : "days"}`;
}

function render() {
  renderWeekHeader();
  renderHabits();
  renderStats();
}

function showForm() {
  habitForm.classList.remove("hidden");
  habitNameInput.focus();
}

document.getElementById("show-form-btn")
  .addEventListener("click", showForm);

document.getElementById("empty-add-btn")
  .addEventListener("click", showForm);

document.getElementById("cancel-btn")
  .addEventListener("click", () => {
    habitForm.reset();
    habitForm.classList.add("hidden");
  });

habitForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = habitNameInput.value.trim();

  if (!name) {
    habitNameInput.focus();
    return;
  }

  habits.push({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    icon: habitIconInput.value,
    completedDates: []
  });

  saveHabits();
  habitForm.reset();
  habitForm.classList.add("hidden");
  render();
});

document.getElementById("today-date").textContent =
  formatDate(new Date());

render();
