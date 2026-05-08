// Hero Section Carousel - Images Auto Rotation
document.addEventListener('DOMContentLoaded', function() {
  const heroSubtitle = document.getElementById('heroSubtitle');
  const heroHome = document.querySelector('.hero-home');
  
  // Array of hero data: images and subtitle
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
  const rotationInterval = 4000; // 4 seconds
  const transitionDuration = 600;

  // Preload all images
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

  // Set transitions - synchronized fade for subtitle
  heroSubtitle.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  heroHome.style.transition = 'background-image 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  
  // Start rotation
  setInterval(updateHero, rotationInterval);
});


