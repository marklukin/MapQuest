import { auth } from './auth.js';

let countries = [];
let currentRound = 1;
const totalRounds = 15;
let score = 0;
let currentCountry = null;
let hintCount = 0;
let usedCountries = new Set();
let attempt = 1; //будет две попытки

const countryImage = document.getElementById('country-image');
const optionsContainer = document.getElementById('options-container');
const hintButton = document.getElementById('hint-btn');
const hintContainer = document.getElementById('hint-container');
const roundInfo = document.getElementById('round-info');
const scoreElement = document.getElementById('score');

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

  countries = await fetchCountries(region);
  if (countries.length === 0) {
    alert('Failed to load countries. Please try again');
    return;
  }

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
    if (attempt === 1) {
      attempt = 2;
      hintButton.style.display = 'block';
      hintButton.disabled = false;
    } else { //вторая ошибка - показать ответ и перейти дальше
      const buttons = optionsContainer.querySelectorAll('button');
      buttons.forEach(btn => btn.disabled = true);
      for (const button of buttons) {
        if (button.textContent === currentCountry.name) {
          button.classList.remove('btn-outline-primary');
          button.classList.add('btn-success');
        }
      };
      showHintButton(false);
      revealAnswer();
    }
  }

}

function showHint() {
  if (hintCount < 3) {
    const hint = document.createElement('p');
    hint.textContent = `Hint ${hintCount + 1}: 
${currentCountry.hints[hintCount]}`;
    hintContainer.appendChild(hint);
    hintCount++;

    if (hintCount === 3) { //UPD: после третей подсказки показываем кнопку показать ответ
      hintButton.style.display = 'none';

    const showAnswerButton = document.createElement('button');
    showAnswerButton.className = 'btn btn-warning mt-2';
    showAnswerButton.textContent = 'Show Answer';
    showAnswerButton.onclick = () => {
      revealAnswer();
      showAnswerButton.remove();
    }
      hintContainer.appendChild(showAnswerButton);
    }
  }
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

function showHintButton(show) {
  hintButton.style.display = show ? 'block' : 'none';
  hintButton.disabled = !show;
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
  hintContainer.innerHTML = '';

  const finalMessage = document.createElement('div'); //показ финального счета
  finalMessage.className = 'alert alert-success';
  finalMessage.innerHTML = `<h4>The game is over!</h4>
                          <p>Your final score is: ${score} out of ${totalRounds} rounds.</p>`;

  const playAgainButton = document.createElement('button'); //добавление кнопки "Играть снова"
  playAgainButton.className = 'btn btn-primary mt-3';
  playAgainButton.textContent = 'Play again';
  playAgainButton.addEventListener('click', () => {
    initGame(regionNow);
  });

  hintContainer.appendChild(finalMessage);
  hintContainer.appendChild(playAgainButton);
}

function showGameArea(show) { //отдельная функция для очищения/показа игровой области
  countryImage.style.display = show ? 'block' : 'none';
  optionsContainer.style.display = show ? 'block' : 'none';
  roundInfo.style.display = show ? 'block' : 'none';
  scoreElement.style.display = show ? 'block' : 'none';
  if (show) {
    hintContainer.innerHTML = '';
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

hintButton.addEventListener('click', showHint);

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
