'use strict';
import { auth } from './authProxy.js';
import { BiDirectionalPriorityQueue } from './utils/priorityQueue.js';
import { getCountryLoader } from './utils/countryLoader.js';
import { profileContainer, createProfileContainer, showProfileError, updateProfileDisplay, hideProfile, togglePasswordVisibility } from './profile.js';
import { initProfileAuth } from './profile.js';

initProfileAuth(auth);

let countryLoader = null;
let otherRegionNames = [];
let availableCountriesNames = [];

let currentRound = 1;
const totalRounds = 15;
let score = 0;
let currentCountry = null;
let usedCountries = new Set();
let attempt = 1;
let hintUsed = false;
let fiftyUsed = false; //подсказка 50/50, которая одна на всю игру
let gameStartTime = null; //для отслеживания времени игры

const countryImage = document.getElementById('country-image');
const optionsContainer = document.getElementById('options-container');
const hintButton = document.getElementById('hint-btn');
const hintContainer = document.getElementById('hint-container');
const roundInfo = document.getElementById('round-info');
const scoreElement = document.getElementById('score');

let fiftyButton = null;
let finalBlock = null;
let regionNow = 'World'; //текущий регион для кнопки "Играть снова"
let currentView = 'game'; //будет 'game' или 'profile'

async function initGame(region = 'World') { // инициализируем игру
  regionNow = region;
  currentRound = 1;
  score = 0;
  usedCountries.clear();
  fiftyUsed = false;
  hintUsed = false;
  gameStartTime = Date.now();
  currentView = 'game';

  try {
    console.log(`Initializing game for region: ${region}`) //debug
    countryLoader = await getCountryLoader();

    if (region === 'World') {
      availableCountriesNames = await countryLoader.getAllCountryNames();
      otherRegionNames = [];
    } else {
      availableCountriesNames = await countryLoader.getCountryNamesFromRegion(region);
      otherRegionNames = await countryLoader.getOtherRegionNames(region);
    }

    console.log(`Loaded ${availableCountriesNames.length} countries for game`); // debug
    console.log(`Loaded ${otherRegionNames.length} other region names`); // debug

    if (availableCountriesNames.length < 4) {
      throw new Error(`Not enough countries in region ${region}. Need at least 4, got ${availableCountriesNames.length}`)
    }

    removeFinalBlock();
    hideProfile();
    updateRoundInfo();
    updateScore();
    showGameArea(true);

    await startNewRound();
    logCountriesFromRegion('Europe');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    alert('Failed to load game data. Please try again');
  }
}

const hintsQueue = new BiDirectionalPriorityQueue();

async function startNewRound() {
  if (currentRound > totalRounds) {
    endGame();
    return;
  }
  console.log(`Starting round ${currentRound}`); // debug

  attempt = 1;
  hintUsed = false;
  hintContainer.innerHTML = '';
  hintButton.style.display = 'none';
  hintButton.disabled = false;
  hintsQueue.clear();

  const unusedNames = availableCountriesNames.filter(name => !usedCountries.has(name));

  if (unusedNames.length === 0) {
    console.log('All countries used, resetting a set') //debug
    usedCountries.clear();
    unusedNames.push(...availableCountriesNames);
  }

  if (unusedNames.length < 1) {
    throw new Error('No countries available for the round');
  }

  const randomIndex = Math.floor(Math.random() * unusedNames.length);
  const selectedName = unusedNames[randomIndex];
  usedCountries.add(selectedName);  

  currentCountry = await countryLoader.getCountryByName(regionNow, selectedName);
  console.log(`Selected country: ${currentCountry.name}`); //debug

  shuffleArray(currentCountry.hints).forEach(hint => hintsQueue.enqueue(hint));

  countryImage.src = currentCountry.imagePath;
  countryImage.alt = `Country outline`;

  await generateOptions();
  renderFiftyButton();
}

class OptionGenerationStrategy {
  generate(availableCountriesNames, otherRegionNames, currentCountry) {
    throw new Error('Not implemented');
  }
}

class WorldStrategy extends OptionGenerationStrategy {
  generate(availableCountriesNames, otherRegionNames, currentCountry) {
    const otherNames = availableCountriesNames.filter(name => name !== currentCountry.name);
    const shuffledOthers = shuffleArray(otherNames).slice(0, 3).map(name => ({ name }));
    return [currentCountry, ...shuffledOthers];
  }
}

class RegionStrategy extends OptionGenerationStrategy {
  generate(availableCountriesNames, otherRegionNames, currentCountry) {
    const sameRegionIncorrect = availableCountriesNames
      .filter(name => name !== currentCountry.name)
      .slice(0, 2)
      .map(name => ({ name }));
    const needMore = 3 - sameRegionIncorrect.length;
    const otherRegionIncorrect = shuffleArray(otherRegionNames)
        .filter(name => name !== currentCountry.name)
        .slice(0, needMore)
        .map(name => ({ name }));
    return [currentCountry, ...sameRegionIncorrect, ...otherRegionIncorrect];
  }
}

async function generateOptions() {
  optionsContainer.innerHTML = '';

  const strategy = regionNow === 'World' ? new WorldStrategy() : new RegionStrategy();
  let options = strategy.generate(availableCountriesNames, otherRegionNames, currentCountry)
  options = shuffleArray(options);

  for (const country of options) {
    const button = document.createElement('button');
    button.className = 'btn btn-outline-primary mb-2 w-100';
    button.textContent = country.name;
    button.addEventListener('click', () => checkAnswer(button, country.name));
    optionsContainer.appendChild(button);
  }
}
async function logCountriesFromRegion(region) {
  console.log(`Loading countries from ${region} incrementally:`);
  const iterator = countryLoader.getCountriesIterator(region);
  for await (const country of iterator) {
    console.log(`- ${country.name} (Hints: ${country.hints.length}, Image: ${country.imagePath})`);
  }
}

async function fetchUserStats() {
  try {
    if (!auth.token) throw new Error('User is not authenticated!');

    const response = await fetch('/api/v1/players/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-token': auth.token
      }
    });

    if (!response.ok) throw new Error('Failed to fetch user stats');

    return await response.json();
  } catch (error) {
    console.error('Error fetching user stats: ', error);
    return null;
  }
}

async function saveGameResult(region, score, totalTime) {
  try {
    if (!auth.token) return;

    const response = await fetch('/api/v1/players/game-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-token': auth.token
      },
      body: JSON.stringify({
        region: region.toLowerCase(),
        score,
        timeSpent: totalTime
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save game result');
    }

    console.log('Game result saved successfully');
  } catch (error) {
    console.error('Error saving game result: ', error);
  }
}

function checkAnswer(selectedButton, selectedCountry) {
  if (selectedCountry === currentCountry.name) { //если правильный ответ

    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach(btn => btn.disabled = true);
    selectedButton.classList.remove('btn-outline-primary');
    selectedButton.classList.add('btn-success');
    if (attempt === 1) {
      score++;
    } else if (attempt === 2) {
      score += 0.5;
    }
    updateScore();

    setTimeout(() => { // переход на след. раунд после небольшой задержки
      currentRound++;
      updateRoundInfo();
      startNewRound();
    }, 1500);
  } else { //если неправильный ответ
    selectedButton.disabled = true;
    selectedButton.classList.remove('btn-outline-primary');
    selectedButton.classList.add('btn-danger');

    const visibleButtons = Array.from(optionsContainer.querySelectorAll('button'))//проверяем использовано ли 50/50 (когда видно < 3 кнопок)
      .filter(btn => btn.style.display !== 'none' && !btn.disabled);

    if (visibleButtons.length <= 1 || attempt === 2) { // неправильный ответ после 50/50 или вторая попытка - показываем прав. ответ
      const buttons = optionsContainer.querySelectorAll('button');
      buttons.forEach(btn => btn.disabled = true);
      for (const button of buttons) {
        if (button.textContent === currentCountry.name) {
          button.classList.remove('btn-outline-primary');
          button.classList.add('btn-success');
          button.style.display = 'block';
        }
      }
      revealAnswer();
    } else {
      attempt = 2;
      showRandomHint(); //после первой ошибки сразу выводим одну случайную подсказку
      if (fiftyButton) fiftyButton.disabled = true; // 50/50 больше нельзя использовать
    };
  }
}

function showRandomHint() {
  if (hintUsed) return;
  hintUsed = true;

  const hint = hintsQueue.dequeue(); //случайный выбор
  const hintElement = document.createElement('p');
  hintElement.textContent = `Hint: ${hint}`;
  hintContainer.appendChild(hintElement);
}

function revealAnswer() {
  const revealMessage = document.createElement('p');
  revealMessage.innerHTML = `<strong>The correct answer is: 
${currentCountry.name}</strong>`;
  revealMessage.className = 'alert alert-info mt-2';
  hintContainer.appendChild(revealMessage);

  setTimeout(() => {
    currentRound++;
    updateRoundInfo();
    startNewRound();
  }, 2000);
}

function renderFiftyButton() { //создаем кнопку 50/50 под вариантами
  if (!fiftyButton) {
    fiftyButton = document.createElement('button');
    fiftyButton.className = 'btn btn-info mb-2 mt-4 w-100';
    fiftyButton.textContent = '50/50';
    fiftyButton.addEventListener('click', useFiftyFifty);
    optionsContainer.parentNode.insertBefore(fiftyButton, optionsContainer.nextSibling);
  }
  fiftyButton.style.display = fiftyUsed ? 'none' : 'block';
  fiftyButton.disabled = fiftyUsed || attempt === 2;
}

function useFiftyFifty() {
  if (fiftyUsed || attempt === 2) return;
  fiftyUsed = true;
  fiftyButton.disabled = true;

  const buttons = Array.from(optionsContainer.querySelectorAll('button')); //находим все кнопки, которые с неправильными ответами
  const incorrectButtons = buttons.filter(btn => btn.textContent !== currentCountry.name && !btn.disabled);
  shuffleArray(incorrectButtons); // случайно оставляем одну неправильную, остальные убираем
  const toRemove = incorrectButtons.slice(0, incorrectButtons.length - 1);
  toRemove.forEach(btn => btn.style.display = 'none');
  fiftyButton.style.display = 'none';
}

function updateRoundInfo() {
  if (currentRound > totalRounds) {
    roundInfo.textContent = 'Game Over';
  } else {
    roundInfo.textContent = `Round ${currentRound} of ${totalRounds}`;
  }
}

function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

function endGame() {
  showGameArea(false);
  if (auth.token && gameStartTime) {
    const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
    saveGameResult(regionNow, score, totalTime);
  }
  showFinalBlock();
}

function showGameArea(show) { //отдельная функция для очищения/показа игровой области
  countryImage.style.display = show ? 'block' : 'none';
  optionsContainer.style.display = show ? 'block' : 'none';
  roundInfo.style.display = show ? 'block' : 'none';
  scoreElement.style.display = show ? 'block' : 'none';
  if (fiftyButton) fiftyButton.style.display = show && !fiftyUsed ? 'block' : 'none';
  if (show) {
    hintContainer.innerHTML = '';
  }
}

function showFinalBlock() {
  document.querySelector('.container.mt-4').style.display = 'none';

  if (!finalBlock) {
    finalBlock = document.createElement('div');
    finalBlock.style.position = 'fixed';
    finalBlock.style.top = '50%';
    finalBlock.style.left = '50%';
    finalBlock.style.transform = 'translate(-50%, -50%)';
    finalBlock.style.background = '#e9fbe9';
    finalBlock.style.borderRadius = '12px';
    finalBlock.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.07)';
    finalBlock.style.padding = '32px 32px 24px 32px';
    finalBlock.style.textAlign = 'center';
    finalBlock.style.minWidth = '300px';
    finalBlock.style.zIndex = 1000;
    document.body.appendChild(finalBlock);
  }
  finalBlock.innerHTML = `
    <div class='alert alert-success' style='font-size:1.15rem;'>
      <h4>The game is over!</h4>
      <p>Your final score is: <b>${score}</b> out of <b>${totalRounds}</b> rounds.</p>
    </div>
  `;
  const playAgainButton = document.createElement('button');
  playAgainButton.className = 'btn btn-primary mt-3';
  playAgainButton.textContent = 'Play again';
  playAgainButton.onclick = () => {
    removeFinalBlock();
    initGame(regionNow);
  };
  finalBlock.appendChild(playAgainButton);
}

function removeFinalBlock() {
  if (finalBlock) {
    finalBlock.remove();
    finalBlock = null;
    document.querySelector('.container.mt-4').style.display = 'block'; //возвращаем контейнер с игрой
  }
}

function shuffleArray(arr) { //shuffle
  const newArray = [...arr];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
}

async function showProfile() {
  currentView = 'profile';
  showGameArea(false);
  removeFinalBlock();

  if (!profileContainer) createProfileContainer();

  const stats = await fetchUserStats();
  if (stats) {
    updateProfileDisplay(stats);
  } else showProfileError();

  profileContainer.style.display = 'block';
}

document.querySelectorAll('.navbar .nav-link').forEach(link => { // обрабатываем ивенты для навигационных ссылок
  link.addEventListener('click', event => {
    event.preventDefault();

    document.querySelectorAll('.nav-link').forEach(navLink => { // удаляем активный класс со всех ссылок
      navLink.classList.remove('active');
    });

    event.target.classList.add('active'); // добавляем активный класс к нажатой ссылке

    const linkText = event.target.textContent;

    if (linkText === 'Your profile') {
      showProfile()
    } else if (linkText === 'Logout' || linkText === 'Login'){
      return;
    }
    else {
      initGame(linkText);
    }
  })
})

hintButton.addEventListener('click', showRandomHint);

window.addEventListener('DOMContentLoaded', () => { //начало игры когда страница загружается
  const worldLink = document.querySelector('.nav-link[aria-current="page"]'); //устанавливаю активный регион по умолчанию
  if (worldLink) {
    worldLink.classList.add('active');
  }

  initGame('World');
})


// AUTHORIZATION
function handlePostLogin() {
  const modalEl = document.getElementById('authModal');
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();

  document.querySelectorAll('[data-auth]').forEach(el =>
    el.classList.remove('d-none')
  );
  document.querySelectorAll('[data-unauth]').forEach(el =>
    el.classList.add('d-none')
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = new bootstrap.Modal('#authModal');

  auth.addAuthListener((isAuthenticated) => {
    document.querySelectorAll('[data-auth]').forEach(el => 
      el.classList.toggle('d-none', !isAuthenticated)
    );
    document.querySelectorAll('[data-unauth]').forEach(el => 
      el.classList.toggle('d-none', isAuthenticated)
    );
    if (isAuthenticated) {
      modal.hide();
    } else {
      modal.show();
    }
  });

  if (auth.isAuthenticated()) {
    handlePostLogin();
  } else {
    modal.show();
  }

  //LOGIN
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await auth.login(formData.get('username'), formData.get('password'));
      handlePostLogin();
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  });

  //REGISTER
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(e.target);

    const passwordInput = form.querySelector('input[name="password"]');
    const confirmInput = form.querySelector('input[name="confirmPassword"]');
    const usernameInput = form.querySelector('input[name="username"]');

    passwordInput.classList.remove('password-mismatch');
    confirmInput.classList.remove('password-mismatch');

    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
      passwordInput.classList.add('password-mismatch');
      confirmInput.classList.add('password-mismatch');
      alert('Passwords do not match!');
      return;
    }

    try {
      await auth.register(formData.get('username'), password);
      handlePostLogin();
    } catch (error) {
      passwordInput.value = '';
      confirmInput.value = '';
      usernameInput.focus();
      alert('Registration failed: ' + error.message);
    }
  });

  document.querySelector('[data-logout]')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
    location.reload();
  });
});
