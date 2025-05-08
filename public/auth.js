class AuthService {
  constructor() {
    this.token = localStorage.getItem('token') || null;
    this.expireDate = localStorage.getItem('tokenExpire') || null;
    this.authUpdateCallbacks = [];
  }

  async login(username, password) {
    const response = await this._fetchAuth('/api/v1/players/log-in', {
      username,
      password
    });

    this._setTokens(response.token, response.tokenExpireDate);
    this._executeCallbacks();
    return response;
  }

  async register(username, password) {
    const response = await this._fetchAuth('/api/v1/players/register', {
      username,
      password
    });

    this._setTokens(response.token, response.tokenExpireDate);
    this._executeCallbacks();
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpire');
    this.token = null;
    this.expireDate = null;
    this._executeCallbacks();
  }

  isAuthenticated() {
    return !!this.token && new Date() < new Date(this.expireDate);
  }

  addAuthListener(callback) {
    this.authUpdateCallbacks.push(callback);
  }

  removeAuthListener(callback) {
    this.authUpdateCallbacks = this.authUpdateCallbacks.filter(cb => cb !== callback);
  }

  async _fetchAuth(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Authentication failed');
    }

    return await response.json();
  }

  _setTokens(token, expireDate) {
    this.token = token;
    this.expireDate = expireDate;
    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpire', expireDate);
  }

  _executeCallbacks() {
    this.authUpdateCallbacks.forEach(cb => cb(this.isAuthenticated()));
  }
}

export const auth = new AuthService();