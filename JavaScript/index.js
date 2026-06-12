document.addEventListener("DOMContentLoaded", function () {

  const heroSubtitle = document.getElementById("heroSubtitle");
  const heroHome = document.querySelector(".hero-home");
  const homeMenuGrid = document.querySelector(".menu-showcase .menu-grid");

  const escapeHtml = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const normalizeImagePath = (path) => {
    if (!path) return "../Images/menu/chefsign1.jpg";
    if (/^(https?:)?\/\//i.test(path) || path.startsWith("../")) return path;
    return `../${path.replace(/^\/+/, "").replace(/\\/g, "/")}`;
  };

  const splitMenuTitle = (name = "") => {
    const words = String(name).trim().split(/\s+/);
    if (words.length < 3) return escapeHtml(name);
    const midpoint = Math.ceil(words.length / 2);
    return `${escapeHtml(words.slice(0, midpoint).join(" "))}<br>${escapeHtml(words.slice(midpoint).join(" "))}`;
  };

  async function loadHomeMenu() {
    if (!homeMenuGrid) return;

    try {
      const res = await fetch("../api/get_menu.php");
      if (!res.ok) return;
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) return;

      homeMenuGrid.innerHTML = items.slice(0, 6).map((item, index) => {
        const price = Number.parseFloat(item.price) || 0;
        const orderUrl = new URL("order.html", window.location.href);
        orderUrl.searchParams.set("item", item.name);
        orderUrl.searchParams.set("price", price.toFixed(2));
        if (item.id) orderUrl.searchParams.set("recipe_id", item.id);

        return `
          <div class="menu-image-card">
            <img src="${escapeHtml(normalizeImagePath(item.image_path))}" alt="${escapeHtml(item.name)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async">
          </div>
          <div class="menu-info-card">
            <div class="menu-item-top">
              <h3>${splitMenuTitle(item.name)}</h3>
              <span>$${price.toFixed(2)}</span>
            </div>
            <p>${escapeHtml(item.description || "Delicious freshly prepared dish.")}</p>
            <a href="${escapeHtml(orderUrl.pathname.split("/").pop() + orderUrl.search)}" class="menu-order-btn">Order now</a>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error("Could not load home menu:", err);
    }
  }

  const heroData = [
    {
      image: "../Images/admin-bg.jpg",
      subtitle: "Wholesome &amp; Delicious",
    },
    {
      image: "../Images/image2.jpg",
      subtitle: "Premium Quality",
    },
    {
      image: "../Images/image4.jpg",
      subtitle: "DELICIOUS SPECIALTIES",
    },
    {
      image: "../Images/image3.jpg",
      subtitle: "Signature Delights",
    },
  ];

  let currentIndex = 0;
  const rotationInterval = 3000;
  const transitionDuration = 600;

  heroData.forEach((data) => {
    const img = new Image();
    img.src = data.image;
  });

  function updateHero() {
    const data = heroData[currentIndex];

    // Fade out both image and subtitle together
    heroSubtitle.style.opacity = "0";

    // Change both image and subtitle at the same time
    setTimeout(() => {
      heroHome.style.backgroundImage = `url('${data.image}')`;
      heroSubtitle.innerHTML = data.subtitle;

      // Fade in both together
      setTimeout(() => {
        heroSubtitle.style.opacity = "1";
      }, 30);
    }, transitionDuration / 2);

    currentIndex = (currentIndex + 1) % heroData.length;
  }

  // Set initial image and subtitle before rotation starts
  if (heroData.length > 0) {
    heroHome.style.backgroundImage = `url('${heroData[0].image}')`;
    heroSubtitle.innerHTML = heroData[0].subtitle;
    currentIndex = 1;
  }

  // Set transitions - synchronized fade for subtitle
  heroSubtitle.style.transition = "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
  heroHome.style.transition =
    "background-image 0.6s cubic-bezier(0.4, 0, 0.2, 1)";

  // Start rotation
  setInterval(updateHero, rotationInterval);

  // ── Testimony carousel ──────────────────────────────────────────
  const dots = document.querySelectorAll(".testimony-dots span");
  const grid = document.querySelector(".testimony-grid");
  const cards = document.querySelectorAll(".testimony-card");
  let activeIndex = 0;
  let autoSlide;

  function goTo(index) {
    // Update active dot
    dots[activeIndex].classList.remove("active");
    dots[activeIndex].setAttribute("aria-selected", "false");
    activeIndex = index;
    dots[activeIndex].classList.add("active");
    dots[activeIndex].setAttribute("aria-selected", "true");

    // On mobile (≤768px) the grid is a flex row — translate by card widths.
    // Must match the Index.css breakpoint that switches the grid to a flex row.
    if (window.innerWidth <= 768) {
      grid.style.transform = `translateX(-${
        (100 / cards.length) * activeIndex
      }%)`;
    } else {
      // Desktop: clear any leftover mobile translate, fade non-active cards
      grid.style.transform = "";
      cards.forEach((card, i) => {
        card.style.transition = "opacity 0.4s ease";
        card.style.opacity = i === activeIndex ? "1" : "0.35";
      });
    }
  }

  function resetAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(() => {
      goTo((activeIndex + 1) % dots.length);
    }, 4000);
  }

  // Wire up dot clicks and keyboard
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goTo(i);
      resetAutoSlide();
    });
    dot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goTo(i);
        resetAutoSlide();
      }
    });
  });

  // Touch/swipe support for mobile
  let touchStartX = 0;
  grid.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );
  grid.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(Math.min(activeIndex + 1, dots.length - 1));
      else goTo(Math.max(activeIndex - 1, 0));
      resetAutoSlide();
    }
  });

  // Re-apply correct layout on resize
  window.addEventListener("resize", () => goTo(activeIndex));

  // Kick off auto-rotation
  goTo(0);
  resetAutoSlide();
  loadHomeMenu();
});
