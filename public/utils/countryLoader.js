import { memoize } from "./memoize.js";

class CountryDataLoader {

  async getCountryNamesFromRegion(region) {
    const pattern = region === 'World' ? '*.*.name' : `${region}.*.name`;

    return new Promise((resolve, reject) => {
      const names = [];
      oboe('countries.json')
        .node(pattern, function (name) {
          names.push(name);
        })
        .done(() => resolve(names))
        .fail((err) => {
          console.error(`Error loading names for region ${region}: `, err);
          reject(err);
        })
    })
  }

  async getCountryByName(region, name) {
    const pattern = region === 'World' ? '!*.*' : `${region}.*`;

    return new Promise((resolve, reject) => {
      let found = false;
      const stream = oboe('countries.json')
        .node(pattern, function (country) {
          if (country.name === name) {
            found = true;
            resolve(country);
            stream.abort();
          }
          return oboe.drop;
        })
        .fail(err => reject(err))
        .done(() => {
          if (!found) resolve(null)
        })
    })
  }

  async getAllCountryNames() {
    return await this.getCountryNamesFromRegion('World');
  }

  getOtherRegionNames = memoize(async function (selectedRegion) {
    const allNames = await this.getAllCountryNames();
    const regionNames = await this.getCountryNamesFromRegion(selectedRegion);
    const otherNames = allNames.filter(name => !regionNames.includes(name));
    return otherNames;
  }, 5, 10);

}

class CountryDataLoaderProxy {
  constructor(loader) {
    this.loader = loader;
    this._getCountryNamesFromRegion = memoize(
      loader.getCountryNamesFromRegion.bind(loader), 5, 10
    );

    this._getCountryByName = memoize(
      loader.getCountryByName.bind(loader), 5, 10
    );

    this._getAllCountryNames = memoize(
      loader.getAllCountryNames.bind(loader), 5, 10
    );

    this._getOtherRegionNames = loader.getOtherRegionNames.bind(loader);
  }

  async getCountryNamesFromRegion(region) {
    return await this._getCountryNamesFromRegion(region);
  }

  async getCountryByName(region, name) {
    return await this._getCountryByName(region, name);
  }

  async getAllCountryNames() {
    return await this._getAllCountryNames();
  }

  async getOtherRegionNames(selectedRegion) {
    return await this._getOtherRegionNames(selectedRegion);
  }
}

let loaderInstance = null; //singleton
export async function getCountryLoader() {
  if (!loaderInstance) {
    const loader = new CountryDataLoader();
    loaderInstance = new CountryDataLoaderProxy(loader);
  }
  return loaderInstance;
}
