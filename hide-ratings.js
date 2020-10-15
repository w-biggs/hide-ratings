// ==UserScript==
// @name         Hide RYM Ratings If Unrated
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  Hides RYM ratings if you haven't rated them - unless you click a button.
// @author       w_biggs (~joks)
// @match        https://rateyourmusic.com/artist/*
// @match        https://rateyourmusic.com/films/*
// @match        https://rateyourmusic.com/release/*
// @match        https://rateyourmusic.com/film/*
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
 * Sets up the styles for hiding ratings.
 */
const setupHideStyles = function setupHideStyles() {
  const styleEl = document.createElement('style');
  styleEl.id = 'initial-hide-styles';
  const selectors = [
    '.avg_rating',
    '.avg_rating_friends',
    '.track_rating',
    '.disco_avg_rating:not(.tm-visible)',
    '.review_rating',
    '.catalog_rating',
    '.catalog_rating_system_comment',
    '.catalog_stats',
    '.track_rating_hide > .tracks',
  ];

  let hideCSS = ''; // hide
  let showCSS = ''; // show when active
  selectors.forEach((selector, index) => {
    if (index > 0) {
      hideCSS += ', ';
      showCSS += ', ';
    }
    hideCSS += `body:not(.ratings-visible) ${selector}`;
    showCSS += `body:not(.ratings-visible) ${selector}:active`;
  });
  hideCSS += ' { opacity: 0 !important; }';
  showCSS += ' { opacity: 1 !important; }';
  
  styleEl.innerText = `${hideCSS} ${showCSS}`;
  // console.log(styleEl.innerText);
  document.documentElement.appendChild(styleEl);
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
 * Sets up the listener for hide/show events.
 */
const setupListeners = function setupListeners() {
  document.addEventListener('hideRatings', () => {
    document.body.classList.remove('ratings-visible');
  });

  document.addEventListener('showRatings', () => {
    document.body.classList.add('ratings-visible');
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
    const releaseAvg = release.querySelector('.disco_avg_rating');
    if (!rating || !parseFloat(rating.innerText)) {
      hideable.push(releaseAvg);
    } else {
      releaseAvg.classList.add('tm-visible');
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
        hidden.classList.remove('tm-visible');
      }
    });
  });

  document.addEventListener('showRatings', () => {
    const hideable = getProfileHideable();
    hideable.forEach((hidden) => {
      if (hidden) {
        hidden.classList.add('tm-visible');
      }
    });
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
    if (document.body.classList.contains('ratings-visible')) {
      fireHideEvent();
    } else {
      fireShowEvent();
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
  setupHideStyles(pageType);

  document.addEventListener('DOMContentLoaded', () => {
    setupListeners();
    if (pageType === 'release') {
      setupReleasePage();
    } else if (pageType === 'profile') {
      setupProfilePage();
    }
  });
}
