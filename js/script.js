const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Открыть меню");
    });
  });
}

// Интерактивный демонстрационный каталог: переключает примеры материалов.
const subjectContent = {
  math: {
    title: "Математический анализ",
    video: "Пределы и непрерывность",
    notes: "Основные определения",
    tech: "Подготовка к коллоквиуму"
  },
  algorithms: {
    title: "Алгоритмы и структуры",
    video: "Сложность алгоритмов",
    notes: "Структуры данных: кратко",
    tech: "Задачи к практикуму"
  },
  discrete: {
    title: "Дискретная математика",
    video: "Основы комбинаторики",
    notes: "Графы и отношения",
    tech: "Подборка задач по логике"
  }
};

const subjectButtons = document.querySelectorAll(".subject-button");
subjectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    subjectButtons.forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");

    const content = subjectContent[button.dataset.subject];
    if (!content) return;

    document.querySelector("#subject-title").textContent = content.title;
    document.querySelector("#video-title").textContent = content.video;
    document.querySelector("#notes-title").textContent = content.notes;
    document.querySelector("#tech-title").textContent = content.tech;
  });
});
