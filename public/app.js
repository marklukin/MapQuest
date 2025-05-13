'use strict';
import { auth } from './auth.js';

let countries = [];
let currentRound = 1;
const totalRounds = 15;
let score = 0;
let currentCountry = null;
let hintCount = 0;
let usedCountries = new Set();
let attempt = 1; //будет две попытки
let hintUsed = false;
let fiftyUsed = false; //подсказка 50/50, которая одна на всю игру

const countryImage = document.getElementById('country-image');
const optionsContainer = document.getElementById('options-container');
const hintButton = document.getElementById('hint-btn');
const hintContainer = document.getElementById('hint-container');
const roundInfo = document.getElementById('round-info');
const scoreElement = document.getElementById('score');

let fiftyButton = null; //для кнопки 50/50
let finalBlock = null; //для финального экрана

let regionNow = 'World'; //текущий регион для кнопки "Играть снова"

async function fetchCountries(region = 'World') { // получаем данные про страны с сервера
  try {
    const response = await fetch('countries.json');
    if (!response.ok) throw new Error('Failed to fetch countries');

    const allCountries = await response.json();

    if (region === 'World') {        // если регион World, возвращаем все страны со все страны со всех регионов
      let combinedCountries = [];
      for (const regionKey in allCountries) {
        combinedCountries = [...combinedCountries, ...allCountries[regionKey]];
      }
      return combinedCountries;
    }

    return allCountries[region] || []; // иначе возвращаем страны конкретного региона
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

async function initGame(region = 'World') { // инициализируем игру
  regionNow = region;
  currentRound = 1;
  score = 0;
  usedCountries.clear();
  fiftyUsed = false;
  hintUsed = false;

  countries = await fetchCountries(region);
  if (countries.length === 0) {
    alert('Failed to load countries. Please try again');
    return;
  }

  removeFinalBlock();
  updateRoundInfo();
  updateScore();
  showGameArea(true);
  startNewRound();
}

function startNewRound() {

  if (currentRound > totalRounds) {
    endGame();
    return;
  }

  attempt = 1;
  hintUsed = false;
  hintCount = 0;
  hintContainer.innerHTML = '';
  hintButton.style.display = 'none';
  hintButton.disabled = false;

  let availableCountries = countries.filter(country => !usedCountries.has(country.name));

  if (availableCountries.length === 0) { //если все страны использованы, начинаем заново
    usedCountries.clear();
    availableCountries = countries;
  }

  const randomIndex = Math.floor(Math.random() * availableCountries.length);
  currentCountry = availableCountries[randomIndex];
  usedCountries.add(currentCountry.name);

  countryImage.src = currentCountry.imagePath;
  countryImage.alt = `Country outline`;

  generateOptions();
  renderFiftyButton();
}

function generateOptions() {
  optionsContainer.innerHTML = '';

  let incorrectOptions = countries.filter(country => country.name !== currentCountry.name);
  incorrectOptions = shuffleArray(incorrectOptions).slice(0, 3);

  let options = [currentCountry, ...incorrectOptions];
  options = shuffleArray(options);

  for (const country of options) {
    const button = document.createElement('button');
    button.className = 'btn btn-outline-primary mb-2 w-100';
    button.textContent = country.name;
    button.addEventListener('click', () => checkAnswer(button, country.name));
    optionsContainer.appendChild(button);
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
  const randomIndex = Math.floor(Math.random() * 3);
  const hint = document.createElement('p');
  hint.textContent = `Hint: ${currentCountry.hints[randomIndex]}`;
  hintContainer.appendChild(hint);
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

document.querySelectorAll('.navbar .nav-link').forEach(link => { // обрабатываем ивенты для навигационных ссылок
  link.addEventListener('click', event => {
    event.preventDefault();

    document.querySelectorAll('.nav-link').forEach(navLink => { // удаляем активный класс со всех ссылок
      navLink.classList.remove('active');
    });

    event.target.classList.add('active'); // добавляем активный класс к нажатой ссылке

    const region = event.target.textContent; // получаем название региона с текста ссылки

    initGame(region); // и начинаем игру с выбраным регионом
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
  setTimeout(() => initGame('World'), 200);
}

document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('authModal');
  const modal = new bootstrap.Modal(modalEl);

  auth.addAuthListener((isAuthenticated) => {
    document.querySelectorAll('[data-auth]').forEach(el => 
      el.classList.toggle('d-none', !isAuthenticated)
    );
    document.querySelectorAll('[data-unauth]').forEach(el => 
      el.classList.toggle('d-none', isAuthenticated)
    );
  });

  if (auth.isAuthenticated()) {
    handlePostLogin();
  }
  else {
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
    const formData = new FormData(e.target);
    try {
      await auth.register(formData.get('username'), formData.get('password'));
      handlePostLogin();
    } catch (error) {
      alert('Registration failed: ' + error.message);
    }
  });

  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    auth.logout();
    location.reload();
  });
});
