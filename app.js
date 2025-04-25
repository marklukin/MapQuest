let countries = [];
let currentRound = 1;
const totalRounds = 15;
let score = 0;
let currentCountry = null;
let hintNumber = 0;
let usedCountries = new Set();

const countryImage = document.getElementById('country-image');
const optionsContainer = document.getElementById('options-container');
const hintButton = document.getElementById('hint-btn');
const hintContainer = document.getElementById('hint-container');
const roundInfo = document.getElementById('round-info');
const scoreElement = document.getElementById('score');

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

  if (selectedCountry === currentCountry.name) score++;
}

function shuffleArray(arr) {
  const newArray = [...arr];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
} // функція для перетасовки масиву, знадобиться щоб і країни перетасовувати, і варіанти відповідей
