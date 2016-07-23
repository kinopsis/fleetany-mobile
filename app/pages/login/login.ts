'use strict';

import { Component } from '@angular/core';
import {Page, Alert, NavController, Events, Platform} from 'ionic-angular';
import { GooglePlus } from 'ionic-native';
import {TranslateService, TranslatePipe} from 'ng2-translate/ng2-translate';
import {forwardRef, Inject, Type} from '@angular/core';
import {UserData} from '../../providers/user-data';
import {About} from '../about/about';

@Component({
  templateUrl: 'build/pages/login/login.html',
  pipes: [TranslatePipe]
})

export class Login {

  private nav: NavController;
  private platform: Platform;
  private userData: UserData;
  private events: Events;
  private loggedIn: boolean;
  private gpstracking: boolean;
  //private userImage: string;
  private welcome: string;
  private plate: string;
  private vehicles: Array<any>;

  constructor(nav: NavController, userData: UserData, events: Events, platform: Platform, private translate: TranslateService) {
    this.translate = translate;
    this.nav = nav;
    this.platform = platform;
    this.userData = userData;
    this.events = events;
    this.loggedIn = false;
    this.gpstracking = false;
    this.vehicles = []

    this.userData.hasLoggedIn().then((userObj) => {
      this.loggedIn = (userObj !== null);
      this.updateUser(JSON.parse(userObj));   

      this.userData.getPlate().then((value) => {
        this.userData.setPlate(value); 
      });
    });

    this.listenToLoginEvents();
    this.listenToGpsEvents();
  }

  listenToLoginEvents() {
    this.events.subscribe('user:login', () => {
      this.loggedIn = true;
    });

    this.events.subscribe('user:logout', () => {
      this.loggedIn = false;
    });
  }

  listenToGpsEvents() {
    this.events.subscribe('gps:on', () => {
      this.gpstracking = true;
    });

    this.events.subscribe('gps:off', () => {
      this.gpstracking = false;
    });
  }

  googleLogin() {
    if (this.platform.is('mobile')) {
      GooglePlus.login({}).then(
          (obj) => {
            this.userData.login(obj);
            this.updateUser(obj);
          },
          (msg) => {
            this.welcome = "error: " + msg;
          }
      );
    } else {
      let dummyUser = {
        imageUrl: "https://github.com/identicons/jasonlong.png",
        displayName: "dear User",
        email: "dummy@gmail.com"
      }
      this.userData.login(dummyUser);
      this.updateUser(dummyUser);
    }
  }

  confirmLogout() {
    let confirmAlert = Alert.create({
      title: 'Confirm logout',
      message: 'Do you really want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Bye',
          handler: () => {
            this.googleLogout();
          }
        }
      ]
    });
    this.nav.present(confirmAlert);
  }

  googleLogout() {
    if (this.platform.is('mobile')) {
      GooglePlus.logout().then(
          (msg) => {
            //this.userImage = ""
            this.welcome = msg;
            this.plate = '';
          }
      );
    }
    this.userData.logout();
  }

  updateUser(obj) {
    if (obj == null) return false;
    //if (obj.imageUrl) { this.userImage = obj.imageUrl; }
    this.welcome = "Hi, " + obj.displayName + ", " + obj.email;
    this.userData.email = obj.email;
    this.userData.getVehicles().then((vehicles) => {
      this.vehicles = vehicles;
    });

    this.userData.getPlate().then((plate) => {
      this.plate = plate;
    });
  }

  onAbout() {
    this.nav.push(About);
  }

  plateChange(value) {
    if(this.gpstracking) {
      this.userData.showToast('Vehicle can not be changed while gps is on!', 'Error!', this.nav);
    } else {
      this.userData.setPlate(value); 
    }
  }

}
