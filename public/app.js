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
    const response = await fetch(`/api/countries/${region}`);
    if (!response.ok) throw new Error('Failed to fetch countries');
    return await response.json();
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
    button.className = 'btn btn-outline-primary mb-2';
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
${currentCountry.hints[hintCount]}`; //Считаю что в базе данных для каждой страны будет массив hints с 3 подсказками
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

function shuffleArray(arr) {
  const newArray = [...arr];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
} // функція для перетасовки масиву, знадобиться щоб і країни перетасовувати, і варіанти відповідей
