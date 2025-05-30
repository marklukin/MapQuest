import { memoize } from "./memoize.js";

class CountryDataLoader {
  constructor() {
    this.allCountriesData = null;
  }

  async loadAllData() {
    try {
      const response = await fetch('countries.json');
      if (!response.ok) throw new Error('Failed to fetch countries');
      this.allCountriesData = await response.json();
      console.log('Country data loaded!') //for debug
    } catch (error) {
      console.error('Error loading country data: ', error);
      throw error;
    }
  }

  async getCountryNamesFromRegion(region) {
    if (!this.allCountriesData) {
      await this.loadAllData();
    }

    const countries = this.allCountriesData[region] || [];
    return countries.map(country => country.name);
  }

  async getCountryByName(region, name) {
    if (!this.allCountriesData) {
      await this.loadAllData();
    }

    if (region === 'World') {
      for (const countries of Object.values(this.allCountriesData)) {
        const country = countries.find(c => c.name === name);
        if (country) return country;
      }
      return null;
    } else {
      const countries = this.allCountriesData[region] || [];
      return countries.find(country => country.name === name);
    }
  }

  async *getCountriesIterator(region) {
    if (!this.allCountriesData) {
      await this.loadAllData();
    }
    const countries = this.allCountriesData[region] || [];
    for (const country of countries) {
      yield country;
    }
  }

  getOtherRegionNames = memoize(async function(selectedRegion) {
    if (!this.allCountriesData) {
      await this.loadAllData();
    }

    const otherNames = [];
    for (const [regionName, countries] of Object.entries(this.allCountriesData)) {
      if (regionName !== selectedRegion) {
        countries.forEach(country => otherNames.push(country.name));    
      }
    }

    console.log(`Loaded ${otherNames.length} other region names`); //debug please help me ts not working
    return otherNames;
  }, 5, 10);

  async getAllCountryNames() {
    if (!this.allCountriesData) {
      await this.loadAllData();
    }

    const allNames = [];
    for (const countries of Object.values(this.allCountriesData)) {
      countries.forEach(country => allNames.push(country.name));
    }

    return allNames;
  }

  async getAllCountries() {
    if (!this.allCountriesData) {
      await this.loadAllData();
    }

    const allCountries = [];
    for (const countries of Object.values(this.allCountriesData)) {
      allCountries.push(...countries);
    }
    return allCountries;
  }

}

let loaderInstance = null; //singleton
export async function getCountryLoader() {
  if (!loaderInstance) {
    loaderInstance = new CountryDataLoader();
  }
  return loaderInstance;
}
