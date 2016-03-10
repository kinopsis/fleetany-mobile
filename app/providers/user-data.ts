'use strict';

import {Injectable, Inject} from 'angular2/core';
import {Storage, LocalStorage, Events} from 'ionic-angular';
import {Http} from 'angular2/http';
import {Settings} from '../config/settings';

let settings: Settings = new Settings();

@Injectable()
export class UserData {

  private storage: Storage;
  private HAS_LOGGED_IN: string;
  private JSON_OBJECT: string;
  private PLATE: string;
  private RAW_DATA: string;
  private data: any;
  public email: string;

  constructor(
      @Inject(Events) private events: Events,
      @Inject(Http) private http: Http
  ) {
    this.storage = new Storage(LocalStorage);
    this.events = events;
    this.http = http;
    this.HAS_LOGGED_IN = 'hasLoggedIn';
    this.JSON_OBJECT = 'jsonObject';
    this.PLATE = 'plate';
    this.RAW_DATA = 'rawdata';
  }

  login(userObjet) {
    this.storage.set(this.HAS_LOGGED_IN, true);
    this.storage.set(this.JSON_OBJECT, JSON.stringify(userObjet));
    this.email = userObjet.email;
    this.events.publish('user:login');
    this.load();
  }

  logout() {
    this.storage.remove(this.HAS_LOGGED_IN);
    this.storage.remove(this.JSON_OBJECT);
    this.storage.remove(this.PLATE);
    this.storage.remove(this.RAW_DATA);
    this.data = null;
    this.events.publish('user:logout');
  }

  setPlate(plate) {
    this.storage.set(this.PLATE, plate);
  }

  getPlate() {
    return this.storage.get(this.PLATE).then((value) => {
      return value;
    });
  }

  // return a promise
  hasLoggedIn() {
    return this.storage.get(this.JSON_OBJECT).then((value) => {
      return value;
    });
  }

  load() {
    if (this.data) {
      // already loaded data
      return Promise.resolve(this.data);
    }

    if (this.hasLoggedIn()) {
      this.storage.get(this.RAW_DATA).then((value) => {
        return Promise.resolve(value);
      });
    }

    // don't have the data yet
    return new Promise(resolve => {
      // We're using Angular Http provider to request the data,
      // then on the response it'll map the JSON data to a parsed JS object.
      // Next we process the data and resolve the promise with the new data.
      this.http.get(settings.genUrl(settings.vehicles_url, this.email)).subscribe(res => {
        // we've got back the raw data, now generate the core schedule data
        // and save the data for later reference
        this.data = JSON.stringify(res.json());
        this.storage.set(this.RAW_DATA, this.data);
        resolve(this.data);
      });
    });
  }

  getVehicles() {
    return this.load().then(data => {
      let dataP = JSON.parse(data);
      return dataP.vehicles.sort();
    });
  }

}