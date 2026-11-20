/* ==========================================================================
   AFTERNIGHT ESPRESSO — Interaktivní JavaScript (Vanilla ES6+)
   1. Přepínač Day / Night režimu s čistými obrysovými SVG ikonami
   2. Responzivní mobilní navigace
   3. Scroll-reveal animace (IntersectionObserver)
   4. Filtrování nápojového lístku + interaktivní výběr položek (Tasting Tray)
   5. Lightbox galerie s procházením šipkami
   6. Custom výběr data, času a počtu osob v rezervaci + <dialog> potvrzení
   7. Aktuální stav kavárny v patičce
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initMobileNav();
    initScrollReveal();
    initMenuInteractive();
    initLightbox();
    initCustomBooking();
    initOpenStatus();
});

/* 1. Přepínač Day / Night režimu (čisté obrysové SVG ikony) */
function initThemeToggle() {
    const toggleBtn = document.querySelector("#theme-toggle");
    const root = document.documentElement;
    if (!toggleBtn) return;

    const moonIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>`;
    const sunIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
    </svg>`;

    const savedTheme = localStorage.getItem("afternight-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    applyTheme(initialTheme);

    toggleBtn.addEventListener("click", () => {
        const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem("afternight-theme", next);
    });

    function applyTheme(theme) {
        if (theme === "dark") {
            root.setAttribute("data-theme", "dark");
            toggleBtn.innerHTML = `${sunIcon}<span>Day</span>`;
            toggleBtn.setAttribute("aria-label", "Přepnout na denní režim");
        } else {
            root.removeAttribute("data-theme");
            toggleBtn.innerHTML = `${moonIcon}<span>Night</span>`;
            toggleBtn.setAttribute("aria-label", "Přepnout na noční režim");
        }
    }
}

/* 2. Mobilní menu */
function initMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const navList = document.querySelector(".nav-list");
    if (!toggle || !navList) return;

    toggle.addEventListener("click", () => {
        const isOpen = navList.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });
}

/* 3. Scroll-reveal animace */
function initScrollReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    elements.forEach((el) => observer.observe(el));
}

/* 4. Filtrování nápojového lístku + interaktivní výběr položek */
function initMenuInteractive() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const menuItems = document.querySelectorAll(".menu-item");
    const trayBar = document.querySelector("#tray-bar");
    const trayText = document.querySelector("#tray-text");
    const clearBtn = document.querySelector("#tray-clear");
    const reserveTrayBtn = document.querySelector("#tray-reserve");

    if (!menuItems.length) return;

    // Filtrování kategorií
    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const category = btn.dataset.filter;
            menuItems.forEach((item) => {
                const match = category === "all" || item.dataset.category === category;
                item.classList.toggle("hidden", !match);
            });
        });
    });

    // Interaktivní počítadlo položek na večer
    const selection = new Map();

    menuItems.forEach((item) => {
        const name = item.dataset.name;
        const price = Number(item.dataset.price);
        const minusBtn = item.querySelector(".qty-minus");
        const plusBtn = item.querySelector(".qty-plus");
        const countEl = item.querySelector(".qty-count");

        if (!minusBtn || !plusBtn || !countEl) return;

        plusBtn.addEventListener("click", () => {
            const current = selection.get(name)?.qty || 0;
            selection.set(name, { qty: current + 1, price });
            updateTray();
        });

        minusBtn.addEventListener("click", () => {
            const current = selection.get(name)?.qty || 0;
            if (current <= 1) {
                selection.delete(name);
            } else {
                selection.set(name, { qty: current - 1, price });
            }
            updateTray();
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            selection.clear();
            updateTray();
        });
    }

    if (reserveTrayBtn) {
        reserveTrayBtn.addEventListener("click", () => {
            const summary = Array.from(selection.entries())
                .map(([itemName, info]) => `${info.qty}× ${itemName}`)
                .join(", ");
            sessionStorage.setItem("afternight-order", summary);
            window.location.href = "kontakt.html";
        });
    }

    function updateTray() {
        let totalCount = 0;
        let totalPrice = 0;

        menuItems.forEach((item) => {
            const name = item.dataset.name;
            const countEl = item.querySelector(".qty-count");
            const qty = selection.get(name)?.qty || 0;
            if (countEl) countEl.textContent = String(qty);
            item.classList.toggle("selected", qty > 0);
        });

        selection.forEach((info) => {
            totalCount += info.qty;
            totalPrice += info.qty * info.price;
        });

        if (trayBar && trayText) {
            if (totalCount > 0) {
                trayText.innerHTML = `Vybráno: <strong>${totalCount} pol.</strong> (odhad útraty <strong>${totalPrice} Kč</strong>)`;
                trayBar.classList.add("visible");
            } else {
                trayBar.classList.remove("visible");
            }
        }
    }
}

/* 5. Lightbox ve fotogalerii s procházením šipkami */
function initLightbox() {
    const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));
    const lightbox = document.querySelector("#lightbox");
    if (!galleryItems.length || !lightbox) return;

    const lbImg = lightbox.querySelector("img");
    const lbCaption = lightbox.querySelector(".lightbox-caption");
    const lbCounter = lightbox.querySelector(".lightbox-counter");
    const closeBtn = lightbox.querySelector(".lightbox-close");
    const prevBtn = lightbox.querySelector(".lightbox-prev");
    const nextBtn = lightbox.querySelector(".lightbox-next");

    let currentIndex = 0;

    function showSlide(index) {
        currentIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[currentIndex];
        const img = item.querySelector("img");
        const caption = item.querySelector(".gallery-caption");

        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCaption.textContent = caption ? caption.textContent : img.alt;
        if (lbCounter) {
            lbCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
        }
    }

    function openLightbox(index) {
        showSlide(index);
        lightbox.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        document.body.style.overflow = "";
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener("click", () => openLightbox(index));
    });

    if (prevBtn) prevBtn.addEventListener("click", () => showSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => showSlide(currentIndex + 1));
    closeBtn.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showSlide(currentIndex - 1);
        if (e.key === "ArrowRight") showSlide(currentIndex + 1);
    });
}

/* 6. Custom výběr data, času a počtu osob + potvrzení v <dialog> */
function initCustomBooking() {
    const form = document.querySelector("#booking-form");
    const dateContainer = document.querySelector("#date-pills");
    const timeContainer = document.querySelector("#time-slots");
    const guestContainer = document.querySelector("#guest-pills");
    const noteInput = document.querySelector("#note");
    const dialog = document.querySelector("#confirm-dialog");
    const dialogText = document.querySelector("#confirm-text");

    if (!form || !dateContainer || !timeContainer || !guestContainer) return;

    // Předvyplnění výběru z nápojového lístku, pokud si uživatel něco naklikal
    const savedOrder = sessionStorage.getItem("afternight-order");
    if (savedOrder && noteInput && !noteInput.value) {
        noteInput.value = `Předběžný výběr z lístku: ${savedOrder}`;
        sessionStorage.removeItem("afternight-order");
    }

    let selectedDateLabel = "";
    let selectedTime = "";
    let selectedGuests = "2 osoby";

    // Generování nejbližších 7 dnů (pondělí automaticky zamčené = zavřeno)
    const dayNames = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    const today = new Date();
    let firstOpenAssigned = false;

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayIdx = d.getDay();
        const isMonday = dayIdx === 1;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "date-pill";
        btn.disabled = isMonday;

        const labelDate = `${d.getDate()}. ${d.getMonth() + 1}.`;
        const fullLabel = `${dayNames[dayIdx]} ${labelDate}`;

        btn.innerHTML = `<span class="day-name">${isMonday ? "Zavřeno" : dayNames[dayIdx]}</span><span class="day-num">${labelDate}</span>`;

        if (!isMonday && !firstOpenAssigned) {
            btn.classList.add("active");
            selectedDateLabel = fullLabel;
            firstOpenAssigned = true;
        }

        btn.addEventListener("click", () => {
            dateContainer.querySelectorAll(".date-pill").forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            selectedDateLabel = fullLabel;
        });

        dateContainer.appendChild(btn);
    }

    // Generování časových slotů
    const slots = ["15:00", "16:30", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];
    slots.forEach((time, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "time-slot";
        btn.textContent = time;
        if (idx === 3) {
            btn.classList.add("active");
            selectedTime = time;
        }

        btn.addEventListener("click", () => {
            timeContainer.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("active"));
            btn.classList.add("active");
            selectedTime = time;
        });

        timeContainer.appendChild(btn);
    });

    // Výběr počtu osob
    guestContainer.querySelectorAll(".guest-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
            guestContainer.querySelectorAll(".guest-pill").forEach((g) => g.classList.remove("active"));
            btn.classList.add("active");
            selectedGuests = btn.textContent;
        });
    });

    // Odeslání a validace formuláře
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let valid = true;

        const nameInput = form.querySelector("#name");
        const emailInput = form.querySelector("#email");

        if (nameInput.value.trim().length < 2) {
            setFieldError(nameInput, true);
            valid = false;
        } else {
            setFieldError(nameInput, false);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            setFieldError(emailInput, true);
            valid = false;
        } else {
            setFieldError(emailInput, false);
        }

        if (valid && dialog && dialogText) {
            dialogText.textContent = `Těšíme se na vás, ${nameInput.value.trim()}! Stůl pro ${selectedGuests} máme připravený na ${selectedDateLabel} v ${selectedTime}. Potvrzení jsme odeslali na ${emailInput.value.trim()}.`;
            dialog.showModal();
            form.reset();
        }
    });

    function setFieldError(input, hasError) {
        input.classList.toggle("invalid", hasError);
        const errEl = input.parentElement.querySelector(".error-msg");
        if (errEl) errEl.classList.toggle("visible", hasError);
    }
}

/* 7. Aktuální stav kavárny v patičce */
function initOpenStatus() {
    const badge = document.querySelector("#open-status");
    if (!badge) return;

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    const isClosedMonday = day === 1 && hour >= 1;
    const isOpen = !isClosedMonday && (hour >= 14 || hour < 1);

    badge.textContent = isOpen ? "● Právě máme otevřeno" : "○ Otevíráme v úterý–neděli od 14:00";
    badge.style.color = isOpen ? "#16a34a" : "var(--accent)";
}