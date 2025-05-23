export let profileContainer = null;

export function createProfileContainer() {
  profileContainer = document.createElement('div');
  profileContainer.id = 'profile-container';
  profileContainer.className = 'row';
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

  document.querySelector('.container.mt-4').appendChild(profileContainer);
}

export function updateProfileDisplay(stats) {
  const profileContent = document.getElementById('profile-content');

  profileContent.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="card md-3">
          <div class="card-header">
            <h6>Account information</h6>
          </div>
          <div class="card-body">
            <p><strong>Username:</strong> ${stats.username}</p>
            <p><strong>Password:</strong>
              <span id="password-display">••••••••</span>
              <button id="toggle-password" class="btn btn-sm btn-outline-secondary ms-2">
                Show
              </button>
            </p>
            <p><strong>Date of Registration:</strong> ${formatDate(stats.createdAt)}</p>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card md-3">
          <div class="card-header">
            <h6>General Stats</h6>
          </div>
          <div class="card-body">
            <p><strong>Total points:</strong> ${stats.totalScore || 0}</p>
            <p><strong>Games played:</strong> ${stats.gamesPlayed || 0}</p>
            <p><strong>Total game time:</strong> ${formatTime(stats.totalTimeSpent) || 0}</p>
            <p><strong>Average result:</strong> ${stats.gamesPlayed ? (stats.totalScore / stats.gamesPlayed).toFixed(1) : 0}</p>
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
              <div class="col-md-3 text-center">
                <h5>${stats.worldScore || 0}</h5>
                <p class="text-muted">World</p>
              </div>
              <div class="col-md-3 text-center">
                <h5>${stats.europeScore || 0}</h5>
                <p class="text-muted">Europe</p>
              </div>
              <div class="col-md-3 text-center">
                <h5>${stats.asiaScore || 0}</h5>
                <p class="text-muted">Asia</p>
              </div>
              <div class="col-md-3 text-center">
                <h5>${stats.africaScore || 0}</h5>
                <p class="text-muted">Africa</p>
              </div>
              <div class="col-md-3 text-center">
                <h5>${stats.americaScore || 0}</h5>
                <p class="text-muted">America</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);
}

export function showProfileError() {
  const profileContent = document.getElementById('profile-content');
  profileContent.innerHTML = `
    <div class="alert alert-danger" role="alert">
      Failed to load user data. Try again later.
    </div>
  `;
}

export function hideProfile() {
  if (profileContainer) profileContainer.style.display = 'none';
}

export async function togglePasswordVisibility() {
  const passwordDisplay = document.getElementById('password-display');
  const toggleButton = document.getElementById('toggle-password');

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
      }
    } catch (error) {
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
