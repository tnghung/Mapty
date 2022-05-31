'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class WorkOut {
  id = (Date.now() + '').slice(-10);
  date = new Date();
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    const capitalType = `${this.type[0].toUpperCase()}${this.type.slice(1)}`;
    const month = `${months[this.date.getMonth()]}`;
    const dayOfMonth = `${this.date.getDate()}`;
    this.description = `${capitalType} on ${month} ${dayOfMonth}`;
  }
}

class Running extends WorkOut {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._calcPace();
    this._setDescription();
  }

  _calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends WorkOut {
  type = 'cycling';
  constructor(coords, distance, duration, elevantionGain) {
    super(coords, distance, duration);
    this.elevantionGain = elevantionGain;
    this._calcSpeed();
    this._setDescription();
  }

  _calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 19;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._getData();
    inputType.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkOut.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => alert('Can not get your position!'));
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#workouts.forEach((workout) => this._renderWorkOutMarker(workout));
    this.#map.on('click', this._showForm.bind(this));
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _moveToPopup(e) {
    const workOutEle = e.target.closest('.workout');
    if (!workOutEle) return;
    const workout = this.#workouts.find((val) => val.id === workOutEle.dataset.id);
    if (!this.#map) return;
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // --------------- Handle Form ----------------
  _clearTextFields() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    this._clearTextFields();
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    this._clearTextFields();
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _newWorkOut(e) {
    e.preventDefault();

    // Get inputs value
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // Check valid inputs function
    const isAllNumber = (...inputs) => inputs.every((inp) => Number.isFinite(inp));
    const isAllPositive = (...inputs) => inputs.every((inp) => inp > 0);

    // If type = running, create new running instance
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!isAllNumber(distance, duration, cadence) || !isAllPositive(distance, duration, cadence)) return alert('Please enter a positive number!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If type = cycling, create new cycling instance
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (!isAllNumber(distance, duration, elevation) || !isAllPositive(distance, duration, elevation)) return alert('Please enter a positive number!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new workout to workouts array
    this.#workouts.push(workout);

    // Render marker
    this._renderWorkOutMarker(workout);

    // Hide form and clear input fields
    this._hideForm();

    // Add new item to list UI
    this._renderWorkout(workout);

    // Save to local storage
    this._setData();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevantionGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _renderWorkOutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type}-popup` }))
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  }

  _setData() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getData() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((val) => this._renderWorkout(val));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
