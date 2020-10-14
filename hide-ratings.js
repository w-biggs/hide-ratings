// ==UserScript==
// @name         Hide RYM Ratings If Unrated
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Hides RYM ratings if you haven't rated them - unless you click a button.
// @author       w_biggs (~joks)
// @match        https://rateyourmusic.com/artist/*
// @match        https://rateyourmusic.com/films/*
// @match        https://rateyourmusic.com/release/*
// @match        https://rateyourmusic.com/film/*
// @resource     hideStyles https://raw.githubusercontent.com/w-biggs/hide-ratings/master/hide-ratings.css
// @run-at       document-start
// ==/UserScript==

/**
 * Get what type of page we're on.
 */
const getPageType = function getPageType() {
  // should always be length 2 at least thanks to @match
  const splitPath = window.location.pathname.split('/');
  switch (splitPath[1]) {
    case 'artist':
    case 'films':
      return 'profile';
    case 'release':
    case 'film':
      return 'release';
    default:
      return false;
  }
};

/**
 * Fires off a hideRatings event.
 */
const fireHideEvent = function fireHideEvent() {
  const hideEvent = new CustomEvent('hideRatings');
  document.dispatchEvent(hideEvent);
};

/**
 * Fires off a showRatings event.
 */
const fireShowEvent = function fireShowEvent() {
  const showEvent = new CustomEvent('showRatings');
  document.dispatchEvent(showEvent);
};

/**
 * Sets up the button element with the events and stuff that it needs.
 * @param {HTMLElement} button The button to set up.
 */
const setupHideButton = function setupHideButton(button) {
  // eslint-disable-next-line no-param-reassign
  button.innerText = 'Show Ratings';
  button.setAttribute('hiding', 'true');

  button.addEventListener('click', (event) => {
    event.preventDefault();

    if (button.getAttribute('hiding') === 'true') {
      fireShowEvent();
    } else {
      fireHideEvent();
    }
  });

  document.addEventListener('hideRatings', () => {
    button.setAttribute('hiding', 'true');
    // eslint-disable-next-line no-param-reassign
    button.innerText = 'Show Ratings';
  });

  document.addEventListener('showRatings', () => {
    button.setAttribute('hiding', 'false');
    // eslint-disable-next-line no-param-reassign
    button.innerText = 'Hide Ratings';
  });
};

/**
 * Gets the hideable events on release pages.
 */
const getReleaseHideable = function getReleaseHideable() {
  const hideable = [];
  hideable.push(document.querySelector('.avg_rating'));
  hideable.push(document.querySelector('.avg_rating_friends'));

  // 'ranked'
  const infoRows = document.querySelectorAll('.album_info > tbody > tr');
  infoRows.forEach((infoRow) => {
    const rowHead = infoRow.querySelector('th.info_hdr');
    if (rowHead.innerText === 'Ranked') {
      hideable.push(infoRow);
    }
  });

  const trackRatings = document.querySelectorAll('.track_rating');
  trackRatings.forEach((trackRating) => {
    hideable.push(trackRating);
  });
  
  return hideable;
};

/**
 * Sets up the listener for hide/show events on release pages.
 */
const setupReleaseListeners = function setupReleaseListeners() {
  document.addEventListener('hideRatings', () => {
    const hideable = getReleaseHideable();
    hideable.forEach((hidden) => {
      if (hidden) {
        hidden.classList.add('tm-hidden-rating');
      }
    });
    window.hidingRatings = true;
  });

  document.addEventListener('showRatings', () => {
    const hideable = getReleaseHideable();
    hideable.forEach((hidden) => {
      if (hidden) {
        hidden.classList.remove('tm-hidden-rating');
      }
    });
    window.hidingRatings = false;
  });
};

/**
 * Creates the hide button for release pages
 */
const createReleaseHideButton = function createReleaseHideButton() {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.float = 'left';
  const button = document.createElement('div');
  button.classList.add('more_btn');
  button.id = 'show_rating_btn';
  setupHideButton(button);
  buttonContainer.appendChild(button);
  // Insert the button before the .clear element in the row of buttons
  const buttonRow = document.querySelector('.release_my_catalog');
  const clearButton = buttonRow.querySelector('.clear');
  buttonRow.insertBefore(buttonContainer, clearButton);
};

/**
 * Sets up the hiding on release pages.
 */
const setupReleasePage = function setupReleasePage() {
  // Check whether this is a page where ratings should be hidden
  const ratingNum = document.querySelector('.my_catalog_rating > .rating_num');
  if (ratingNum.innerText === '---') {
    setupReleaseListeners();
    fireHideEvent();
    createReleaseHideButton();
  }
};

/**
 * Gets the hideable events on profile pages.
 */
const getProfileHideable = function getProfileHideable() {
  const hideable = [];

  const releases = document.querySelectorAll('.disco_release, ul.films > li');
  releases.forEach((release) => {
    const rating = release.querySelector('.disco_cat_inner');
    if (!rating || !parseFloat(rating.innerText)) {
      const releaseAvg = release.querySelector('.disco_avg_rating');
      hideable.push(releaseAvg);
    }
  });

  return hideable;
};

/**
 * Sets up the listener for hide/show events on profile pages.
 */
const setupProfileListeners = function setupProfileListeners() {
  document.addEventListener('hideRatings', () => {
    const hideable = getProfileHideable();
    hideable.forEach((hidden) => {
      if (hidden) {
        hidden.classList.add('tm-hidden-rating');
      }
    });
    window.hidingRatings = true;
  });

  document.addEventListener('showRatings', () => {
    const hideable = getProfileHideable();
    hideable.forEach((hidden) => {
      if (hidden) {
        hidden.classList.remove('tm-hidden-rating');
      }
    });
    window.hidingRatings = false;
  });

  const discogClasses = [
    '.section_artist_discography',
    '.section_artist_credits',
    '.section_artist_filmography',
  ];

  let discography = false;
  for (let i = 0; i < discogClasses.length; i += 1) {
    const discogClass = discogClasses[i];
    discography = document.querySelector(discogClass);
    if (discography) {
      break;
    }
  }

  const discogObserver = new MutationObserver(() => {
    if (window.hidingRatings) {
      fireShowEvent();
    } else {
      fireHideEvent();
    }
  });
  discogObserver.observe(discography, {
    childList: true,
    subtree: true,
    attributes: false,
  });
};

/**
 * Creates the hide button for profle pages
 */
const createProfileHideButton = function createProfileHideButton() {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.float = 'left';
  const button = document.createElement('a');
  button.href = '#';
  setupHideButton(button);
  buttonContainer.appendChild(button);

  const artistInfo = document.querySelector('.artist_info');

  const clear = document.createElement('div');
  clear.style.clear = 'both';
  artistInfo.appendChild(clear);

  const header = document.createElement('div');
  header.innerText = 'Show / Hide Ratings';
  header.classList.add('info_hdr');
  header.style.marginTop = '1em';
  artistInfo.appendChild(header);

  const content = document.createElement('div');
  content.classList.add('info_content');
  content.appendChild(buttonContainer);
  artistInfo.appendChild(content);
};

/**
 * Sets up the hiding on profile pages.
 */
const setupProfilePage = function setupProfilePage() {
  setupProfileListeners();
  fireHideEvent();
  createProfileHideButton();
};

const pageType = getPageType();

if (pageType) {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('hide-ratings-loaded');
    if (pageType === 'release') {
      setupReleasePage();
    } else if (pageType === 'profile') {
      setupProfilePage();
    }
  });
}
