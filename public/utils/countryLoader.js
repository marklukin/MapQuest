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

let loaderInstance = null; //singleton
export async function getCountryLoader() {
  if (!loaderInstance) {
    loaderInstance = new CountryDataLoader();
  }
  return loaderInstance;
}
