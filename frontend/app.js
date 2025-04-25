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
  optionsContainer = '';

  let incorrectOptions = countries.filter(country => country.name !== currentCountry.name);
  incorrectOptions = shuffleArray(incorrectOptions).slice(0, 3);

  let options = [currentCountry, ...incorrectOptions];
  options = shuffleArray(options);
}

function shuffleArray(arr) {
  const newArray = [...arr];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
} // функція для перетасовки масиву, знадобиться щоб і країни перетасовувати, і варіанти відповідей
