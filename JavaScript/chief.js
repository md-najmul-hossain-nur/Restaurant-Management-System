// Chief Dashboard JavaScript - Modal and Form Management

// Get the current page from data attribute
const currentPage = document.body.getAttribute('data-page');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeModals();
  initializeEventListeners();
  loadRecipes();
  loadProfile();
});

// ============================================
// MODAL MANAGEMENT
// ============================================

function initializeModals() {
  // Close modal buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = btn.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  // Close modal on background click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeModal(modal) {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  // Reset form if it exists
  const form = modal.querySelector('form');
  if (form) form.reset();
}

// ============================================
// RECIPES PAGE
// ============================================

function initializeEventListeners() {
  if (currentPage === 'recipes') {
    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const recipeForm = document.getElementById('recipeForm');
    const recipeImageFile = document.getElementById('recipeImageFile');
    const recipeImageUrl = document.getElementById('recipeImageUrl');
    const previewImage = document.querySelector('[data-image-preview]');

    if (addRecipeBtn) {
      addRecipeBtn.addEventListener('click', () => openModal('recipeModal'));
    }

    if (recipeForm) {
      recipeForm.addEventListener('submit', handleRecipeSubmit);
    }

    // Image preview handling
    if (recipeImageFile) {
      recipeImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (previewImage) previewImage.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (recipeImageUrl) {
      recipeImageUrl.addEventListener('change', (e) => {
        if (previewImage && e.target.value) {
          previewImage.src = e.target.value;
        }
      });
    }
  }

  // Profile page
  if (currentPage === 'profile') {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const profileImageFile = document.getElementById('profileImageFile');
    const profileImageUrl = document.getElementById('profileImageUrl');
    const previewImage = document.querySelector('[data-profile-preview]');

    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        loadProfileFormData();
        openModal('profileModal');
      });
    }

    if (profileForm) {
      profileForm.addEventListener('submit', handleProfileSubmit);
    }

    // Image preview handling
    if (profileImageFile) {
      profileImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (previewImage) previewImage.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (profileImageUrl) {
      profileImageUrl.addEventListener('change', (e) => {
        if (previewImage && e.target.value) {
          previewImage.src = e.target.value;
        }
      });
    }
  }

  // Clock out button
  document.querySelectorAll('[data-clock-out]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clock out?')) {
        window.location.href = 'login.html';
      }
    });
  });
}

function handleRecipeSubmit(e) {
  e.preventDefault();

  const recipeName = document.getElementById('recipeName').value;
  const recipeTime = document.getElementById('recipeTime').value;
  const recipeIngredients = document.getElementById('recipeIngredients').value;
  const recipeNote = document.getElementById('recipeNote').value;
  const recipeImageUrl = document.getElementById('recipeImageUrl').value;
  const previewImage = document.querySelector('[data-image-preview]');

  // Get image from preview or use default
  let imageUrl = recipeImageUrl || previewImage.src;
  if (!imageUrl || imageUrl.includes('bowl.png')) {
    imageUrl = '../Images/food/bowl.png';
  }

  // Create recipe object
  const recipe = {
    id: Date.now(),
    name: recipeName,
    time: recipeTime,
    ingredients: recipeIngredients.split('\n').filter(i => i.trim()),
    note: recipeNote,
    image: imageUrl,
    createdAt: new Date().toLocaleDateString()
  };

  // Save to localStorage
  saveRecipe(recipe);

  // Close modal
  const modal = document.getElementById('recipeModal');
  closeModal(modal);

  // Reload recipes
  loadRecipes();

  // Show success message
  alert('Recipe added successfully!');
}

function saveRecipe(recipe) {
  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  recipes.push(recipe);
  localStorage.setItem('recipes', JSON.stringify(recipes));
}

function loadRecipes() {
  if (currentPage !== 'recipes') return;

  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  const recipeList = document.getElementById('recipeList');

  if (!recipeList) return;

  if (recipes.length === 0) {
    recipeList.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>No recipes yet. Click "+ Add Recipe" to get started!</p>
      </div>
    `;
    return;
  }

  recipeList.innerHTML = recipes.map(recipe => `
    <article class="card recipe-card">
      <img class="recipe-image" src="${recipe.image}" alt="${recipe.name}" onerror="this.src='../Images/food/bowl.png'">
      <div class="recipe-body">
        <div>
          <h3 class="card-title">${recipe.name}</h3>
          <p class="card-subtitle">Prep time: ${recipe.time}</p>
        </div>
        <div class="recipe-meta">
          <span class="pill">${recipe.time}</span>
          <span class="pill">${recipe.ingredients.length} ingredients</span>
        </div>
        <div class="chip-group">
          ${recipe.ingredients.slice(0, 2).map(ing => `<span class="chip">${ing.substring(0, 20)}${ing.length > 20 ? '...' : ''}</span>`).join('')}
        </div>
        ${recipe.note ? `<p class="card-subtitle">${recipe.note}</p>` : ''}
        <div class="actions" style="margin-top: 12px; gap: 8px;">
          <button class="btn btn-secondary" onclick="deleteRecipe(${recipe.id})">Delete</button>
        </div>
      </div>
    </article>
  `).join('');
}

function deleteRecipe(recipeId) {
  if (!confirm('Are you sure you want to delete this recipe?')) return;

  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  const filtered = recipes.filter(r => r.id !== recipeId);
  localStorage.setItem('recipes', JSON.stringify(filtered));
  loadRecipes();
}

// ============================================
// PROFILE PAGE
// ============================================

function handleProfileSubmit(e) {
  e.preventDefault();

  const profileData = {
    name: document.getElementById('profileName').value,
    role: document.getElementById('profileRole').value,
    email: document.getElementById('profileEmail').value,
    phone: document.getElementById('profilePhone').value,
    location: document.getElementById('profileLocation').value,
    since: document.getElementById('profileSince').value,
    note: document.getElementById('profileNote').value,
    image: document.getElementById('profileImageUrl').value || document.querySelector('[data-profile-preview]').src
  };

  // Save to localStorage
  localStorage.setItem('profileData', JSON.stringify(profileData));

  // Close modal
  const modal = document.getElementById('profileModal');
  closeModal(modal);

  // Reload profile
  loadProfile();

  alert('Profile updated successfully!');
}

function loadProfileFormData() {
  const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');

  if (Object.keys(profileData).length > 0) {
    document.getElementById('profileName').value = profileData.name || '';
    document.getElementById('profileRole').value = profileData.role || '';
    document.getElementById('profileEmail').value = profileData.email || '';
    document.getElementById('profilePhone').value = profileData.phone || '';
    document.getElementById('profileLocation').value = profileData.location || '';
    document.getElementById('profileSince').value = profileData.since || '';
    document.getElementById('profileNote').value = profileData.note || '';
    document.getElementById('profileImageUrl').value = profileData.image || '';
    
    const previewImage = document.querySelector('[data-profile-preview]');
    if (previewImage && profileData.image) {
      previewImage.src = profileData.image;
    }
  }
}

function loadProfile() {
  if (currentPage !== 'profile') return;

  const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
  const profileCard = document.getElementById('profileCard');

  if (!profileCard) return;

  // Update profile card with saved data
  const profileName = profileCard.querySelector('[data-profile-name]');
  const profileRole = profileCard.querySelector('[data-profile-role]');
  const profileNote = profileCard.querySelector('[data-profile-note]');
  const profileEmail = profileCard.querySelector('[data-profile-email]');
  const profilePhone = profileCard.querySelector('[data-profile-phone]');
  const profileLocation = profileCard.querySelector('[data-profile-location]');
  const profileSince = profileCard.querySelector('[data-profile-since]');
  const profileImage = profileCard.querySelector('[data-profile-image]');

  if (Object.keys(profileData).length > 0) {
    if (profileName) profileName.textContent = profileData.name || 'Richard Clark';
    if (profileRole) profileRole.textContent = profileData.role || 'Chief Chef';
    if (profileNote) profileNote.textContent = profileData.note || 'Member of the kitchen team';
    if (profileEmail) profileEmail.textContent = profileData.email || 'sadique21.hossain@email.com';
    if (profilePhone) profilePhone.textContent = profileData.phone || '01787967661';
    if (profileLocation) profileLocation.textContent = profileData.location || 'Motijheel, Dhaka';
    if (profileSince) profileSince.textContent = profileData.since || 'Member since Jan 2024';
    if (profileImage && profileData.image) profileImage.src = profileData.image;
  }
}

// ============================================
// ORDERS PAGE
// ============================================

// Mark order as ready
document.addEventListener('DOMContentLoaded', () => {
  if (currentPage === 'orders') {
    document.querySelectorAll('.order-card .btn').forEach(btn => {
      if (btn.textContent.includes('Mark Ready')) {
        btn.addEventListener('click', (e) => {
          e.target.textContent = '✓ Marked Ready';
          e.target.style.opacity = '0.6';
          e.target.disabled = true;
          setTimeout(() => {
            e.target.closest('.order-card').style.opacity = '0.5';
          }, 500);
        });
      }
    });
  }
});
