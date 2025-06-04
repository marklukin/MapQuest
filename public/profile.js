import { memoize } from './utils/memoizeAvatar.js';
import { auth } from './auth.js';
export let profileContainer = null;

export function createProfileContainer() {
  profileContainer = document.createElement('div');
  profileContainer.id = 'profile-container';
  profileContainer.className = 'container mt-4';
  profileContainer.style.display = 'none';
  profileContainer.innerHTML = `
    <div class="col-12">
      <div class="card">
        <div class="card-header">
          <h5>User Profile</h5>
        </div>
        <div class="card-body" id="profile-content">
          <div class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const gameContainer = document.querySelector('.container.mt-4');
  gameContainer.parentNode.insertBefore(profileContainer, gameContainer.nextSibling);
}

export function updateProfileDisplay(stats) {
  const profileContent = document.getElementById('profile-content');

  const totalScore = (stats.world_score || 0) + (stats.europe_score || 0) + 
                    (stats.asia_score || 0) + (stats.africa_score || 0) + 
                    (stats.usa_score || 0);

  profileContent.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="card mb-3">
          <div class="card-header">
            <h6>Account information</h6>
          </div>
          <div class="card-body">

            <div class="text-center mb-3">
              <div class="avatar-container" style="position: relative; display: inline-block;">
                <img id="user-avatar" 
                     src="${stats.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNjY2NjY2MiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gQXZhdGFyPC90ZXh0Pjwvc3ZnPg=='}" 
                     alt="User Avatar" 
                     class="rounded-circle" 
                     style="width: 100px; height: 100px; object-fit: cover; border: 3px solid #dee2e6;">
                <button id="change-avatar-btn" 
                        class="btn btn-sm btn-primary position-absolute" 
                        style="bottom: 0; right: 0; border-radius: 50%; width: 30px; height: 30px; padding: 0;">
                  📷
                </button>
              </div>
              <input type="file" id="avatar-input" accept="image/*" style="display: none;">
            </div>

            <p><strong>Username:</strong> ${stats.username}</p>

            <div id="password-change-section">
              <p><strong>Password:</strong> ••••••••
                <button id="change-password-btn" class="btn btn-sm btn-outline-secondary ms-2">
                  Change
                </button>
              </p>
              
              <form id="password-change-form" class="mt-3" style="display: none;">
                <div class="mb-3">
                  <label for="new-password" class="form-label">New Password</label>
                  <input type="password" class="form-control" id="new-password" required>
                </div>
                <div class="mb-3">
                  <label for="confirm-password" class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" id="confirm-password" required>
                </div>
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-primary">Save Changes</button>
                  <button type="button" class="btn btn-secondary" id="cancel-password-change">Cancel</button>
                </div>
                <div id="password-change-message" class="mt-2"></div>
              </form>
            </div>

            <p><strong>Date of Registration:</strong> ${formatDate(stats.createdAt)}</p>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card mb-3">
          <div class="card-header">
            <h6>General Stats</h6>
          </div>
          <div class="card-body">
            <p><strong>Total points:</strong> ${stats.totalScore || totalScore}</p>
            <p><strong>Games played:</strong> ${stats.gamesPlayed || 0}</p>
            <p><strong>Total game time:</strong> ${formatTime(stats.totalTimeSpent || 0)}</p>
            <p><strong>Average result:</strong> ${stats.gamesPlayed && stats.gamesPlayed > 0 ? (stats.totalScore / stats.gamesPlayed).toFixed(1) : 0}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h6>Stats by regions</h6>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-2 text-center">
                <h5>${stats.world_score || 0}</h5>
                <p class="text-muted">World</p>
              </div>
              <div class="col-md-2 text-center">
                <h5>${stats.europe_score || 0}</h5>
                <p class="text-muted">Europe</p>
              </div>
              <div class="col-md-2 text-center">
                <h5>${stats.asia_score || 0}</h5>
                <p class="text-muted">Asia</p>
              </div>
              <div class="col-md-2 text-center">
                <h5>${stats.africa_score || 0}</h5>
                <p class="text-muted">Africa</p>
              </div>
              <div class="col-md-2 text-center">
                <h5>${stats.usa_score || 0}</h5>
                <p class="text-muted">America</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
}

function setupEventListeners() {
  const changeAvatarBtn = document.getElementById('change-avatar-btn');
  const avatarInput = document.getElementById('avatar-input');

  const changePasswordBtn = document.getElementById('change-password-btn');
  const passwordForm = document.getElementById('password-change-form');
  const cancelBtn = document.getElementById('cancel-password-change');

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      passwordForm.style.display = 'block';
      changePasswordBtn.style.display = 'none';
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      passwordForm.style.display = 'none';
      changePasswordBtn.style.display = 'inline-block';
      document.getElementById('password-change-message').textContent = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    });
  }
  
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordChange);
  }
  
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', triggerAvatarUpload);
  }
  
  if (avatarInput) {
    avatarInput.addEventListener('change', handleAvatarChange);
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const messageElement = document.getElementById('password-change-message');
  const passwordForm = document.getElementById('password-change-form');
  const changePasswordBtn = document.getElementById('change-password-btn');
  
  messageElement.textContent = '';
  messageElement.className = 'mt-2';

  if (newPassword !== confirmPassword) {
    messageElement.textContent = 'New passwords do not match!';
    messageElement.className = 'mt-2 text-danger';
    return;
  }
  
  if (newPassword.length < 6) {
    messageElement.textContent = 'Password must be at least 6 characters!';
    messageElement.className = 'mt-2 text-danger';
    return;
  }
  
  try {
    const response = await fetch('/api/v1/players/changePassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-token': auth.token
      },
      body: JSON.stringify({
        newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.err || 'Password change failed');
    }

    messageElement.textContent = 'Password changed successfully!';
    messageElement.className = 'mt-2 text-success';

    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    setTimeout(() => {
      passwordForm.style.display = 'none';
      changePasswordBtn.style.display = 'inline-block';
      messageElement.textContent = '';
    }, 2000);
    
  } catch (error) {
    console.error('Password change error:', error);
    messageElement.textContent = 'Error: ' + error.message;
    messageElement.className = 'mt-2 text-danger';
  }
}

export function showProfileError() {
  const profileContent = document.getElementById('profile-content');
  profileContent.innerHTML = `
    <div class="alert alert-danger" role="alert">
      Failed to load user data. Try again later.
    </div>
  `;
}

export function hideProfile(currentView) {
  if (profileContainer) profileContainer.style.display = 'none';

  const gameContainer = document.querySelector('.container.mt-4');
  if (gameContainer && currentView !== 'profile') {
    gameContainer.style.display = 'block';
  }
}

export async function togglePasswordVisibility() {
  const passwordDisplay = document.getElementById('password-display');
  const toggleButton = document.getElementById('toggle-password');

  if (!passwordDisplay || !toggleButton) return;

  if (passwordDisplay.textContent === '••••••••') {
    try {
      const response = await fetch('/api/v1/players/password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-token': auth.token
        }
      });

      if (response.ok) {
        const data = await response.json();
        passwordDisplay.textContent = data.password || 'Error receiving password';
        toggleButton.textContent = 'Hide';
      } else {
        passwordDisplay.textContent = 'Error loading password';
      }
    } catch (error) {
      console.error('Password loading error:', error);
      passwordDisplay.textContent = 'Loading error';
    }
  } else {
    passwordDisplay.textContent = '••••••••';
    toggleButton.textContent = 'Show';
  }
}

//вспомогательные функции форматирования времени
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('uk-UA');
}

function formatTime(seconds) {
  if (!seconds) return '0 minutes';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

//Avatar functions
export function triggerAvatarUpload() {
  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput) {
    avatarInput.click();
  }
}

export async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    showAvatarError('Image too large. Maximum size is 2MB.');
    return;
  }

  if (!file.type.startsWith('image/')) {
    showAvatarError('Please select a valid image file.');
    return;
  }

  try {
    showAvatarLoading();

    const base64 = await fileToBase64Memoized(file);

    await updateAvatar(base64);

    const avatarImg = document.getElementById('user-avatar');
    if (avatarImg) {
      avatarImg.src = base64;
    }
    
    showAvatarSuccess();
  } catch (error) {
    console.error('Error updating avatar:', error);
    showAvatarError('Failed to update avatar. Please try again.');
  }
}

export async function updateAvatar(avatarBase64) {
  const response = await fetch('/api/v1/players/updateAvatar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-token': auth.token
    },
    body: JSON.stringify({
      avatar: avatarBase64
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.err || 'Failed to update avatar');
  }

  return response.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
const fileToBase64Memoized = memoize(fileToBase64);

function showAvatarLoading() {
  const avatarImg = document.getElementById('user-avatar');
  const changeBtn = document.getElementById('change-avatar-btn');
  
  changeBtn.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div>';
  changeBtn.disabled = true;
  avatarImg.style.opacity = '0.6';
}

function showAvatarSuccess() {
  const changeBtn = document.getElementById('change-avatar-btn');
  const avatarImg = document.getElementById('user-avatar');
  
  changeBtn.innerHTML = '✓';
  changeBtn.disabled = false;
  avatarImg.style.opacity = '1';
  
  setTimeout(() => {
    changeBtn.innerHTML = '📷';
  }, 2000);
}

function showAvatarError(message) {
  const changeBtn = document.getElementById('change-avatar-btn');
  const avatarImg = document.getElementById('user-avatar');
  
  changeBtn.innerHTML = '❌';
  changeBtn.disabled = false;
  avatarImg.style.opacity = '1';

  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-2';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const avatarContainer = document.querySelector('.avatar-container').parentNode;
  avatarContainer.appendChild(alertDiv);

  setTimeout(() => {
    changeBtn.innerHTML = '📷';
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 3000);
}