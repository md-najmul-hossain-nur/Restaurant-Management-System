document.addEventListener('DOMContentLoaded', function() {
  const heroSubtitle = document.getElementById('heroSubtitle');
  const heroHome = document.querySelector('.hero-home');
  
  const heroData = [
    {
      image: '../Images/admin-bg.jpg',
      subtitle: 'Wholesome &amp; Delicious'
    },
    {
      image: '../Images/image2.jpg',
      subtitle: 'Premium Quality'
    },
    {
      image: '../Images/image4.jpg',
      subtitle: 'DELICIOUS SPECIALTIES'
    },
    {
      image: '../Images/image3.jpg',
      subtitle: 'Signature Delights'
    }
  ];

  let currentIndex = 0;
  const rotationInterval = 3000; 
  const transitionDuration = 600;

  heroData.forEach(data => {
    const img = new Image();
    img.src = data.image;
  });

  function updateHero() {
    const data = heroData[currentIndex];
    
    // Fade out both image and subtitle together
    heroSubtitle.style.opacity = '0';
    
    // Change both image and subtitle at the same time
    setTimeout(() => {
      heroHome.style.backgroundImage = `url('${data.image}')`;
      heroSubtitle.innerHTML = data.subtitle;
      
      // Fade in both together
      setTimeout(() => {
        heroSubtitle.style.opacity = '1';
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
  heroSubtitle.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  heroHome.style.transition = 'background-image 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  
  // Start rotation
  setInterval(updateHero, rotationInterval);

  // ── Testimony carousel ──────────────────────────────────────────
  const dots        = document.querySelectorAll('.testimony-dots span');
  const grid        = document.querySelector('.testimony-grid');
  const cards       = document.querySelectorAll('.testimony-card');
  let   activeIndex = 0;
  let   autoSlide;

  function goTo(index) {
    // Update active dot
    dots[activeIndex].classList.remove('active');
    dots[activeIndex].setAttribute('aria-selected', 'false');
    activeIndex = index;
    dots[activeIndex].classList.add('active');
    dots[activeIndex].setAttribute('aria-selected', 'true');

    // On mobile (≤980px) the grid is a flex row — translate by card widths
    // On desktop the grid shows all 3 cards, but we still visually highlight
    if (window.innerWidth <= 980) {
      grid.style.transform = `translateX(-${(100 / cards.length) * activeIndex}%)`;
    } else {
      // Desktop: fade the non-active cards slightly
      cards.forEach((card, i) => {
        card.style.transition = 'opacity 0.4s ease';
        card.style.opacity    = i === activeIndex ? '1' : '0.35';
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
    dot.addEventListener('click', () => { goTo(i); resetAutoSlide(); });
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(i); resetAutoSlide(); }
    });
  });

  // Touch/swipe support for mobile
  let touchStartX = 0;
  grid.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  grid.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo(Math.min(activeIndex + 1, dots.length - 1));
      else          goTo(Math.max(activeIndex - 1, 0));
      resetAutoSlide();
    }
  });

  // Re-apply correct layout on resize
  window.addEventListener('resize', () => goTo(activeIndex));

  // Kick off auto-rotation
  goTo(0);
  resetAutoSlide();
});