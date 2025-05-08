import { auth } from './auth.js';

let countries = [];
let currentRound = 1;
const totalRounds = 15;
let score = 0;
let currentCountry = null;
let hintCount = 0;
let usedCountries = new Set();

const countryImage = document.getElementById('country-image');
const optionsContainer = document.getElementById('options-container');
const hintButton = document.getElementById('hint-btn');
const hintContainer = document.getElementById('hint-container');
const roundInfo = document.getElementById('round-info');
const scoreElement = document.getElementById('score');

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
  currentRound = 1;
  score = 0;
  usedCountries.clear();

  countries = await fetchCountries(region);
  if (countries.length === 0) {
    alert('Failed to load countries. Please try again');
    return;
  }

  updateRoundInfo();
  updateScore();

  startNewRound();
}

function startNewRound() {

  if (currentRound > totalRounds) {
    endGame();
    return;
  }

  hintCount = 0;
  hintContainer.innerHTML = '';
  hintButton.style.display = 'block';

  let availableCountries = countries.filter(country => !usedCountries.has(country.name));

  if (availableCountries.length === 0) { //если все страны использованы, начинаем заного
    usedCountries.clear();
    availableCountries = countries;
  }

  const randomIndex = Math.floor(Math.random() * availableCountries.length);
  currentCountry = availableCountries[randomIndex];
  usedCountries.add(currentCountry.name);

  countryImage.src = currentCountry.imagePath;
  countryImage.alt = `Country outline`;

  generateOptions();
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
    button.addEventListener('click', () => checkAnswer(country.name));
    optionsContainer.appendChild(button);
  }
}

function checkAnswer(selectedCountry) {
  const buttons = optionsContainer.querySelectorAll('button');

  for (const button of buttons) {
    button.disabled = true;

    if (button.textContent === currentCountry.name) {
      button.classList.remove('btn-outline-primary');
      button.classList.add('btn-success');
    }
  
    if (button.textContent === selectedCountry && selectedCountry !== currentCountry.name) {
      button.classList.remove('btn-outline-primary');
      button.classList.add('btn-danger');
    }
  };

  if (selectedCountry === currentCountry.name) {
    score++;
    updateScore();

    setTimeout(() => { // переход на след. раунд после небольшой задержки
      currentRound++;
      updateRoundInfo();
      startNewRound();
    }, 1500);
  } else {
    hintButton.style.display = 'block'; // если неправильный ответ - выскакивает кнопка подсказки
  }
}

function showHint() {
  if (hintCount < 3) {
    const hint = document.createElement('p');
    hint.textContent = `Hint ${hintCount + 1}: 
${currentCountry.hints[hintCount]}`;
    hintContainer.appendChild(hint);
    hintCount++;

    if (hintCount === 3) { //максимум 3 подсказки, и тогда будет показываться ответ и переходить на следующий раунд
      hintButton.style.display = 'none';

      const revealMessage = document.createElement('p');
      revealMessage.innerHTML = `<strong>The correct answer is: 
${currentCountry.name}</strong>`;
        revealMessage.className = 'alert alert-info';
        hintContainer.appendChild(revealMessage);

        setTimeout(() => {
          currentRound++;
          updateRoundInfo();
          startNewRound();
        }, 3000);
    }
  }
}

function updateRoundInfo() {
  roundInfo.textContent = `Round ${currentRound} of ${totalRounds}`;
}

function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

function endGame() {
  countryImage.src = ''; //очищение игровой области
  optionsContainer.innerHTML = '';
  hintContainer.innerHTML = '';
  hintButton.style.display = 'none';

  const finalMessage = document.createElement('div'); //показ финального счета
  finalMessage.className = 'alert alert-success';
  finalMessage.innerHTML = `<h4>The game is over!</h4>
                          <p>Your final score is: ${score} out of ${totalRounds} rounds.</p>`;

  const playAgainButton = document.createElement('button'); //добавление кнопки "Играть снова"
  playAgainButton.className = 'btn btn-primary mt-3';
  playAgainButton.textContent = 'Play again';
  playAgainButton.addEventListener('click', () => { // получаем текущий активный регион
    const activeRegion = document.querySelector('.nav-link.active');
    const region = activeRegion ? activeRegion.textContent : 'World';
    initGame(region);
  });

  hintContainer.appendChild(finalMessage);
  hintContainer.appendChild(playAgainButton);
}

function shuffleArray(arr) {
  const newArray = [...arr];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
} // функція для перетасовки масиву, знадобиться щоб і країни перетасовувати, і варіанти відповідей

document.querySelectorAll('.nav-link').forEach(link => { // обрабатываем ивенты для навигационных ссылок
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

hintButton.addEventListener('click', showHint);

window.addEventListener('DOMContentLoaded', () => { //начало игры когда страница загружается
  const worldLink = document.querySelector('.nav-link[aria-current="page"]'); //устанавливаю активный регион по умолчанию
  if (worldLink) {
    worldLink.classList.add('active');
  }

  initGame('World');
})

document.addEventListener('DOMContentLoaded', () => {
  auth.addAuthListener((isAuthenticated) => {
    document.querySelectorAll('[data-auth]').forEach(el => 
      el.classList.toggle('d-none', !isAuthenticated)
    );
    document.querySelectorAll('[data-unauth]').forEach(el => 
      el.classList.toggle('d-none', isAuthenticated)
    );
  });

  if (!auth.isAuthenticated()) {
    new bootstrap.Modal('#authModal').show();
  }

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await auth.login(formData.get('username'), formData.get('password'));
      bootstrap.Modal.getInstance('#authModal').hide();
      initGame();
    } catch (error) {
      alert(error.message);
    }
  });

  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await auth.register(formData.get('username'), formData.get('password'));
      bootstrap.Modal.getInstance('#authModal').hide();
      initGame();
    } catch (error) {
      alert(error.message);
    }
  });

  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    auth.logout();
    location.reload();
  });

  if (auth.isAuthenticated()) {
    initGame();
  }
});
