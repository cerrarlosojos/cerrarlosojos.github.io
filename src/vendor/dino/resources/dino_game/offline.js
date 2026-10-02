// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { setRunnerState } from './runner-state.js';
import { HIDDEN_CLASS } from '../constants.js';

import { FPS, IS_HIDPI, IS_IOS, IS_MOBILE } from './constants.js';
import { DistanceMeter } from './distance_meter.js';
import { GameOverPanel } from './game_over_panel.js';
import { GeneratedSoundFx } from './generated_sound_fx.js';
import { Horizon } from './horizon.js';
import { Obstacle } from './obstacle.js';
import {
  CollisionBox,
  spriteDefinitionByType,
} from './offline-sprite-definitions.js';
import { Trex } from './trex.js';
import { getTimeStamp } from './utils.js';

// *****************************************************************************

/**
 * Default game width.
 * @const
 */
const DEFAULT_WIDTH = 600;

/** @const */
const A11Y_STRINGS = {
  ariaLabel: 'dinoGameA11yAriaLabel',
  description: 'dinoGameA11yDescription',
  gameOver: 'dinoGameA11yGameOver',
  highScore: 'dinoGameA11yHighScore',
  jump: 'dinoGameA11yJump',
  started: 'dinoGameA11yStartGame',
  speedLabel: 'dinoGameA11ySpeedToggle',
};

/**
 * T-Rex runner.
 * @param {string} outerContainerId Outer containing element id.
 * @param {!Object=} opt_config
 * @constructor
 * @implements {EventListener}
 * @export
 */

const loadTimeData = undefined;

// @change -> Refactored Functional to Class based structure
export class Runner {
  /**
   * Default game configuration.
   * Shared config for all  versions of the game. Additional parameters are
   * defined in Runner.normalConfig and Runner.slowConfig.
   */
  static config = {
    AUDIOCUE_PROXIMITY_THRESHOLD: 190,
    AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
    BG_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: 10,
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    FADE_DURATION: 1,
    FLASH_DURATION: 1000,
    GAMEOVER_CLEAR_TIME: 1200,
    INITIAL_JUMP_VELOCITY: 12,
    INVERT_FADE_DURATION: 12000,
    MAX_BLINK_COUNT: 3,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_OBSTACLE_DUPLICATION: 2,
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3,
  };

  static normalConfig = {
    ACCELERATION: 0.001,
    AUDIOCUE_PROXIMITY_THRESHOLD: 190,
    AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
    GAP_COEFFICIENT: 0.6,
    INVERT_DISTANCE: 700,
    MAX_SPEED: 13,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    SPEED: 6,
  };

  static slowConfig = {
    ACCELERATION: 0.0005,
    AUDIOCUE_PROXIMITY_THRESHOLD: 170,
    AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 220,
    GAP_COEFFICIENT: 0.3,
    INVERT_DISTANCE: 350,
    MAX_SPEED: 9,
    MOBILE_SPEED_COEFFICIENT: 1.5,
    SPEED: 4.2,
  };

  /**
   * Default dimensions.
   */
  static defaultDimensions = {
    WIDTH: DEFAULT_WIDTH,
    HEIGHT: 150,
  };

  /**
   * CSS class names.
   * @enum {string}
   */
  static classes = {
    CANVAS: 'runner-canvas',
    CONTAINER: 'runner-container',
    CRASHED: 'crashed',
    TOUCH_CONTROLLER: 'controller',
  };

  /**
   * Sound FX. Reference to the ID of the audio tag on interstitial page.
   * @enum {string}
   */
  static sounds = {
    BUTTON_PRESS: 'offline-sound-press',
    HIT: 'offline-sound-hit',
    SCORE: 'offline-sound-reached',
  };

  /**
   * Key code mapping.
   * @enum {Object}
   */
  static keycodes = {
    JUMP: { 38: 1, 32: 1 }, // Up, spacebar
    DUCK: { 40: 1 }, // Down
    RESTART: { 13: 1 }, // Enter
  };

  /**
   * Runner event names.
   * @enum {string}
   */
  static events = {
    CLICK: 'click',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    POINTERDOWN: 'pointerdown',
    POINTERUP: 'pointerup',
    TOUCHEND: 'touchend',
    TOUCHSTART: 'touchstart',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
  };

  // static methods
  /**
   * Updates the canvas size taking into
   * account the backing store pixel ratio and
   * the device pixel ratio.
   *
   * See article by Paul Lewis:
   * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
   *
   * @param {HTMLCanvasElement} canvas
   * @param {number=} opt_width
   * @param {number=} opt_height
   * @return {boolean} Whether the canvas was scaled.
   */
  static updateCanvasScaling = function (canvas, opt_width, opt_height) {
    const context = /** @type {CanvasRenderingContext2D} */ (
      canvas.getContext('2d')
    );

    // Query the various pixel ratios
    const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    /** @suppress {missingProperties} */
    const backingStoreRatio =
      Math.floor(context.webkitBackingStorePixelRatio) || 1;
    const ratio = devicePixelRatio / backingStoreRatio;

    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
      const oldWidth = opt_width || canvas.width;
      const oldHeight = opt_height || canvas.height;

      canvas.width = oldWidth * ratio;
      canvas.height = oldHeight * ratio;

      canvas.style.width = `${oldWidth}px`;
      canvas.style.height = `${oldHeight}px`;

      // Scale the context to counter the fact that we've manually scaled
      // our canvas element.
      context.scale(ratio, ratio);
      return true;
    }
    if (devicePixelRatio === 1) {
      // Reset the canvas width / height. Fixes scaling bug when the page is
      // zoomed and the devicePixelRatio changes accordingly.
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
    }
    return false;
  };

  /**
   * Whether events are enabled.
   * @return {boolean}
   */
  static isAltGameModeEnabled = () => false;

  constructor(outerContainerEl, opt_config, options = {}) {
    this.options = options;
    this.destroyed = false;
    this.disposers = [];
    Runner.audioCues = false;
    Runner.generatedSoundFx = null;

    this.outerContainerEl = outerContainerEl;
    this.containerEl = null;
    // A div to intercept touch events. Only set while (playing && useTouch).
    this.touchController = null;

    Runner.config = { ...Runner.config, ...Runner.normalConfig, ...opt_config };
    this.config = Runner.config;
    // Logical dimensions of the container.
    this.dimensions = { ...Runner.defaultDimensions };

    this.gameType = null;
    Runner.spriteDefinition = spriteDefinitionByType.original;

    this.altGameImageSprite = null;
    this.altGameModeActive = false;
    this.altGameModeFlashTimer = null;
    this.fadeInTimer = 0;

    this.canvas = null;
    this.canvasCtx = null;

    this.tRex = null;

    this.distanceMeter = null;
    this.distanceRan = 0;

    this.highestScore = 0;

    this.time = 0;
    this.runningTime = 0;
    this.msPerFrame = 1000 / FPS;
    this.currentSpeed = this.config.SPEED;
    Runner.slowDown = false;

    this.activated = false; // Whether the easter egg has been activated.
    this.playing = false; // Whether the game is currently in play state.
    this.crashed = false;
    this.paused = false;
    this.inverted = false;
    this.invertTimer = 0;

    this.playCount = 0;

    /** @type {Object} */
    this.soundFx = {};
    this.generatedSoundFx = null;

    // Session-owned web audio context for playing sounds.
    this.audioContext = null;

    this.loadImages();
  }

  // Class Methods

  /**
   * Use the adapter's preloaded sprite and matching sprite sheet definition.
   */
  loadImages() {
    this.spriteDef = IS_HIDPI ? Runner.spriteDefinition.HDPI : Runner.spriteDefinition.LDPI;
    Runner.imageSprite = this.options.sprite;
    Runner.origImageSprite = Runner.imageSprite;
    this.init();
  }

  /**
   * Load and decode the adapter's sound URLs.
   */
  loadSounds() {
    if (this.audioContext || !window.AudioContext || this.destroyed) return;
    try {
      this.audioContext = new AudioContext();
    } catch {
      return; // Audio restrictions must not block starting the game.
    }
    this.audioAbort = new AbortController();
    const context = this.audioContext;
    for (const [sound, url] of Object.entries(this.options.sounds)) {
      fetch(url, { signal: this.audioAbort.signal })
        .then(response => {
          if (!response.ok) throw new Error('Unable to load game sound');
          return response.arrayBuffer();
        })
        .then(buffer => context.decodeAudioData(buffer))
        .then(audio => {
          if (!this.destroyed) this.soundFx[sound] = audio;
        })
        .catch(() => {}); // The game remains playable when audio is unavailable.
    }
  }

  /**
   * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
   * @param {number=} opt_speed
   */
  setSpeed(opt_speed) {
    const speed = opt_speed || this.currentSpeed;

    // Reduce the speed on smaller mobile screens.
    if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
      const mobileSpeed = Runner.slowDown
        ? speed
        : ((speed * this.dimensions.WIDTH) / DEFAULT_WIDTH) *
          this.config.MOBILE_SPEED_COEFFICIENT;
      this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
    } else if (opt_speed) {
      this.currentSpeed = opt_speed;
    }
  }

  /**
   * Game initialiser.
   */
  init() {
    if (this.destroyed) return;
    // Keep shared engine state local to this module.
    setRunnerState(Runner);

    this.adjustDimensions();
    this.setSpeed();

    const ariaLabel = getA11yString(A11Y_STRINGS.ariaLabel);
    this.containerEl = document.createElement('div');
    this.containerEl.setAttribute('role', 'presentation');
    this.containerEl.setAttribute('tabindex', '-1');
    this.containerEl.setAttribute(
      'title',
      getA11yString(A11Y_STRINGS.description)
    );
    this.containerEl.setAttribute('aria-label', ariaLabel);

    this.containerEl.className = Runner.classes.CONTAINER;

    // Player canvas container.
    this.canvas = createCanvas(
      this.containerEl,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT
    );

    // Live region for game status updates.
    this.a11yStatusEl = document.createElement('span');
    this.a11yStatusEl.className = 'offline-runner-live-region';
    this.a11yStatusEl.setAttribute('aria-live', 'assertive');
    this.a11yStatusEl.textContent = '';
    Runner.a11yStatusEl = this.a11yStatusEl;

    // Add checkbox to slow down the game.
    this.slowSpeedCheckboxLabel = document.createElement('label');
    this.slowSpeedCheckboxLabel.className = 'slow-speed-option hidden';
    this.slowSpeedCheckboxLabel.textContent = getA11yString(
      A11Y_STRINGS.speedLabel
    );

    this.slowSpeedCheckbox = document.createElement('input');
    this.slowSpeedCheckbox.setAttribute('type', 'checkbox');
    this.slowSpeedCheckbox.setAttribute(
      'title',
      getA11yString(A11Y_STRINGS.speedLabel)
    );
    this.slowSpeedCheckbox.setAttribute('tabindex', '0');
    this.slowSpeedCheckbox.setAttribute('checked', 'checked');

    this.slowSpeedToggleEl = document.createElement('span');
    this.slowSpeedToggleEl.className = 'slow-speed-toggle';

    this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedCheckbox);
    this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedToggleEl);

    if (IS_IOS) {
      this.outerContainerEl.appendChild(this.a11yStatusEl);
    } else {
      this.containerEl.appendChild(this.a11yStatusEl);
    }

    this.generatedSoundFx = new GeneratedSoundFx();

    this.canvasCtx = /** @type {CanvasRenderingContext2D} */ (
      this.canvas.getContext('2d')
    );
    this.canvasCtx.fillStyle = '#f7f7f7';
    this.canvasCtx.fill();
    Runner.updateCanvasScaling(this.canvas);

    // Horizon contains clouds, obstacles and the ground.
    this.horizon = new Horizon(
      this.canvas,
      this.spriteDef,
      this.dimensions,
      this.config.GAP_COEFFICIENT
    );

    // Distance meter
    this.distanceMeter = new DistanceMeter(
      this.canvas,
      this.spriteDef.TEXT_SPRITE,
      this.dimensions.WIDTH
    );

    // Draw t-rex
    this.tRex = new Trex(this.canvas, this.spriteDef.TREX);

    this.outerContainerEl.appendChild(this.containerEl);
    // @change -> Hide the slow speed control
    // this.outerContainerEl.appendChild(this.slowSpeedCheckboxLabel);

    this.startListening();
    this.update();

    this.isDarkMode = false;
    this.initializeHighScore(this.options.highScore || 0);

  }

  /**
   * Create the touch controller. A div that covers whole screen.
   */
  createTouchController() {
    this.touchController = document.createElement('div');
    this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
    this.touchController.addEventListener(Runner.events.TOUCHSTART, this);
    this.touchController.addEventListener(Runner.events.TOUCHEND, this);
    this.outerContainerEl.appendChild(this.touchController);
  }

  /**
   * Adjust game space dimensions on resize.
   */
  adjustDimensions() {
    if (this.destroyed) return;

    const boxStyles = window.getComputedStyle(this.outerContainerEl);
    const padding = Number(
      boxStyles.paddingLeft.substr(0, boxStyles.paddingLeft.length - 2)
    );

    this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;

    // Redraw the elements back onto the canvas.
    if (this.canvas) {
      this.canvas.width = this.dimensions.WIDTH;
      this.canvas.height = this.dimensions.HEIGHT;

      Runner.updateCanvasScaling(this.canvas);

      this.distanceMeter.calcXPos(this.dimensions.WIDTH);
      this.clearCanvas();
      this.horizon.update(0, 0, true);
      this.tRex.update(0);

      // Outer container and distance meter.
      if (this.playing || this.crashed || this.paused) {
        this.containerEl.style.width = `${this.dimensions.WIDTH}px`;
        this.containerEl.style.height = `${this.dimensions.HEIGHT}px`;
        this.distanceMeter.update(0, Math.ceil(this.distanceRan));
        this.stop();
      } else {
        this.tRex.draw(0, 0);
      }

      // Game over panel.
      if (this.crashed && this.gameOverPanel) {
        this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
        this.gameOverPanel.draw(this.altGameModeActive, this.tRex);
      }
    }
  }

  /**
   * Play the game intro.
   * Canvas container width expands out to the full width.
   */
  playIntro() {
    if (!this.activated && !this.crashed) {
      this.activated = true;
      this.startGame();
    } else if (this.crashed) {
      this.restart();
    }
  }

  /**
   * Update the game status to started.
   */
  startGame() {
    this.toggleSpeed();
    this.runningTime = 0;
    this.playingIntro = false;
    this.tRex.playingIntro = false;
    this.containerEl.style.webkitAnimation = '';
    this.playCount++;
    this.generatedSoundFx.background();

    if (Runner.audioCues) {
      this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.jump));
    }

    if (!this.visibilityListening) {
      this.visibilityListening = true;
      this.listen(document, Runner.events.VISIBILITY, () => {
        if (document.hidden) this.stop();
      });
      this.listen(window, Runner.events.BLUR, () => this.stop());
    }
  }

  clearCanvas() {
    this.canvasCtx.clearRect(
      0,
      0,
      this.dimensions.WIDTH,
      this.dimensions.HEIGHT
    );
  }

  /**
   * Checks whether the canvas area is in the viewport of the browser
   * through the current scroll position.
   * @return boolean.
   */
  isCanvasInView() {
    return !this.destroyed && this.outerContainerEl.contains(document.activeElement);
  }

  /**
   * Enable the alt game mode. Switching out the sprites.
   */
  enableAltGameMode() {
    Runner.imageSprite = Runner.altGameImageSprite;
    Runner.spriteDefinition = spriteDefinitionByType[Runner.gameType];

    if (IS_HIDPI) {
      this.spriteDef = Runner.spriteDefinition.HDPI;
    } else {
      this.spriteDef = Runner.spriteDefinition.LDPI;
    }

    this.altGameModeActive = true;
    this.tRex.enableAltGameMode(this.spriteDef.TREX);
    this.horizon.enableAltGameMode(this.spriteDef);
    this.generatedSoundFx.background();
  }

  /**
   * Update the game frame and schedules the next one.
   */
  update() {
    this.updatePending = false;

    const now = getTimeStamp();
    let deltaTime = now - (this.time || now);

    // Flashing when switching game modes.
    if (this.altGameModeFlashTimer < 0 || this.altGameModeFlashTimer === 0) {
      this.altGameModeFlashTimer = null;
      this.tRex.setFlashing(false);
      this.enableAltGameMode();
    } else if (this.altGameModeFlashTimer > 0) {
      this.altGameModeFlashTimer -= deltaTime;
      this.tRex.update(deltaTime);
      deltaTime = 0;
    }

    this.time = now;

    if (this.playing) {
      this.clearCanvas();

      // Additional fade in - Prevents jump when switching sprites
      if (
        this.altGameModeActive &&
        this.fadeInTimer <= this.config.FADE_DURATION
      ) {
        this.fadeInTimer += deltaTime / 1000;
        this.canvasCtx.globalAlpha = this.fadeInTimer;
      } else {
        this.canvasCtx.globalAlpha = 1;
      }

      if (this.tRex.jumping) {
        this.tRex.updateJump(deltaTime);
      }

      this.runningTime += deltaTime;
      const hasObstacles = this.runningTime > this.config.CLEAR_TIME;

      // First jump triggers the intro.
      if (this.tRex.jumpCount === 1 && !this.playingIntro) {
        this.playIntro();
      }

      // The horizon doesn't move until the intro is over.
      if (this.playingIntro) {
        this.horizon.update(0, this.currentSpeed, hasObstacles);
      } else if (!this.crashed) {
        const showNightMode = this.isDarkMode ^ this.inverted;
        deltaTime = !this.activated ? 0 : deltaTime;
        this.horizon.update(
          deltaTime,
          this.currentSpeed,
          hasObstacles,
          showNightMode
        );
      }

      // Check for collisions.
      let collision =
        hasObstacles && checkForCollision(this.horizon.obstacles[0], this.tRex);

      // For a11y, audio cues.
      if (Runner.audioCues && hasObstacles) {
        const jumpObstacle =
          this.horizon.obstacles[0].typeConfig.type !== 'COLLECTABLE';

        if (!this.horizon.obstacles[0].jumpAlerted) {
          const threshold = Runner.isMobileMouseInput
            ? Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y
            : Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD;
          const adjProximityThreshold =
            threshold +
            threshold * Math.log10(this.currentSpeed / Runner.config.SPEED);

          if (this.horizon.obstacles[0].xPos < adjProximityThreshold) {
            if (jumpObstacle) {
              this.generatedSoundFx.jump();
            }
            this.horizon.obstacles[0].jumpAlerted = true;
          }
        }
      }

      // Activated alt game mode.
      if (
        Runner.isAltGameModeEnabled() &&
        collision &&
        this.horizon.obstacles[0].typeConfig.type === 'COLLECTABLE'
      ) {
        this.horizon.removeFirstObstacle();
        this.tRex.setFlashing(true);
        collision = false;
        this.altGameModeFlashTimer = this.config.FLASH_DURATION;
        this.runningTime = 0;
        this.generatedSoundFx.collect();
      }

      if (!collision) {
        this.distanceRan += (this.currentSpeed * deltaTime) / this.msPerFrame;

        if (this.currentSpeed < this.config.MAX_SPEED) {
          this.currentSpeed += this.config.ACCELERATION;
        }
      } else {
        this.gameOver();
      }

      const playAchievementSound = this.distanceMeter.update(
        deltaTime,
        Math.ceil(this.distanceRan)
      );

      if (!Runner.audioCues && playAchievementSound) {
        this.playSound(this.soundFx.SCORE);
      }

      // Night mode.
      if (!Runner.isAltGameModeEnabled()) {
        if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
          this.invertTimer = 0;
          this.invertTrigger = false;
          this.invert(false);
        } else if (this.invertTimer) {
          this.invertTimer += deltaTime;
        } else {
          const actualDistance = this.distanceMeter.getActualDistance(
            Math.ceil(this.distanceRan)
          );

          if (actualDistance > 0) {
            this.invertTrigger = !(
              actualDistance % this.config.INVERT_DISTANCE
            );

            if (this.invertTrigger && this.invertTimer === 0) {
              this.invertTimer += deltaTime;
              this.invert(false);
            }
          }
        }
      }
    }

    if (
      this.playing ||
      (!this.activated && this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)
    ) {
      this.tRex.update(deltaTime);
      this.scheduleNextUpdate();
    }
  }

  /**
   * Event handler.
   * @param {Event} e
   */
  handleEvent(e) {
    switch (e.type) {
      case Runner.events.KEYDOWN:
      case Runner.events.TOUCHSTART:
      case Runner.events.POINTERDOWN:
        this.onKeyDown(e);
        break;
      case Runner.events.KEYUP:
      case Runner.events.TOUCHEND:
      case Runner.events.POINTERUP:
        this.onKeyUp(e);
        break;
    }
  }

  /**
   * Initialize audio cues if activated by focus on the canvas element.
   * @param {Event} e
   */
  handleCanvasKeyPress(e) {
    if (!this.activated && !Runner.audioCues) {
      this.toggleSpeed();
      Runner.audioCues = true;
      this.generatedSoundFx.init();
      Runner.generatedSoundFx = this.generatedSoundFx;
      Runner.config.CLEAR_TIME *= 1.2;
    } else if (e.keyCode && Runner.keycodes.JUMP[e.keyCode]) {
      this.onKeyDown(e);
    }
  }

  /**
   * Toggle speed setting if toggle is shown.
   */
  toggleSpeed() {
    if (Runner.audioCues) {
      const speedChange = Runner.slowDown !== this.slowSpeedCheckbox.checked;

      if (speedChange) {
        Runner.slowDown = this.slowSpeedCheckbox.checked;
        const updatedConfig = Runner.slowDown
          ? Runner.slowConfig
          : Runner.normalConfig;

        Runner.config = Object.assign(Runner.config, updatedConfig);
        this.currentSpeed = updatedConfig.SPEED;
        this.tRex.enableSlowConfig();
        this.horizon.adjustObstacleSpeed();
      }
      if (this.playing) {
        this.disableSpeedToggle(true);
      }
    }
  }

  /**
   * Show the speed toggle.
   * From focus event or when audio cues are activated.
   * @param {Event=} e
   */
  showSpeedToggle(e) {
    const isFocusEvent = e && e.type === 'focus';
    if (Runner.audioCues || isFocusEvent) {
      this.slowSpeedCheckboxLabel.classList.toggle(
        HIDDEN_CLASS,
        isFocusEvent ? false : !this.crashed
      );
    }
  }

  /**
   * Disable the speed toggle.
   * @param {boolean} disable
   */
  disableSpeedToggle(disable) {
    if (disable) {
      this.slowSpeedCheckbox.setAttribute('disabled', 'disabled');
    } else {
      this.slowSpeedCheckbox.removeAttribute('disabled');
    }
  }

  /**
   * Bind relevant key / mouse / touch listeners.
   */
  listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.disposers.push(() => target.removeEventListener(event, handler, options));
  }

  startListening() {
    this.listen(this.outerContainerEl, Runner.events.KEYDOWN, this);
    this.listen(this.outerContainerEl, Runner.events.KEYUP, this);
    this.listen(this.containerEl, Runner.events.TOUCHSTART, this, { passive: false });
    this.listen(this.containerEl, Runner.events.TOUCHEND, this, { passive: false });
    this.listen(this.containerEl, Runner.events.POINTERDOWN, this);
    this.listen(this.containerEl, Runner.events.POINTERUP, this);
  }

  stopListening() {
    this.disposers.splice(0).forEach(dispose => dispose());
  }

  /**
   * Process keydown.
   * @param {Event} e
   */
  onKeyDown(e) {
    // Prevent native page scrolling whilst tapping on mobile.
    if (IS_MOBILE && this.playing) {
      e.preventDefault();
    }

    if (this.isCanvasInView()) {
      // Allow toggling of speed toggle.
      if (
        Runner.keycodes.JUMP[e.keyCode] &&
        e.target === this.slowSpeedCheckbox
      ) {
        return;
      }

      if (!this.crashed && !this.paused) {
        // For a11y, screen reader activation.
        const isMobileMouseInput =
          IS_MOBILE &&
          e.type === Runner.events.POINTERDOWN &&
          e.pointerType === 'mouse' &&
          (e.target === this.containerEl ||
            (IS_IOS &&
              (e.target === this.touchController || e.target === this.canvas)));

        if (
          Runner.keycodes.JUMP[e.keyCode] ||
          e.type === Runner.events.TOUCHSTART ||
          isMobileMouseInput
        ) {
          e.preventDefault();
          // Starting the game for the first time.
          if (!this.playing) {
            // Started by touch so create a touch controller.
            if (!this.touchController && e.type === Runner.events.TOUCHSTART) {
              this.createTouchController();
            }

            if (isMobileMouseInput) {
              this.handleCanvasKeyPress(e);
            }
            this.loadSounds();
            this.setPlayStatus(true);
            this.update();
          }
          // Start jump.
          if (!this.tRex.jumping && !this.tRex.ducking) {
            if (Runner.audioCues) {
              this.generatedSoundFx.cancelFootSteps();
            } else {
              this.playSound(this.soundFx.BUTTON_PRESS);
            }
            this.tRex.startJump(this.currentSpeed);
          }
        } else if (this.playing && Runner.keycodes.DUCK[e.keyCode]) {
          e.preventDefault();
          if (this.tRex.jumping) {
            // Speed drop, activated only when jump key is not pressed.
            this.tRex.setSpeedDrop();
          } else if (!this.tRex.jumping && !this.tRex.ducking) {
            // Duck.
            this.tRex.setDuck(true);
          }
        }
      }
    }
  }

  /**
   * Process key up.
   * @param {Event} e
   */
  onKeyUp(e) {
    const keyCode = String(e.keyCode);
    const isjumpKey =
      Runner.keycodes.JUMP[keyCode] ||
      e.type === Runner.events.TOUCHEND ||
      e.type === Runner.events.POINTERUP;

    if (this.isRunning() && isjumpKey) {
      this.tRex.endJump();
    } else if (Runner.keycodes.DUCK[keyCode]) {
      this.tRex.speedDrop = false;
      this.tRex.setDuck(false);
    } else if (this.crashed) {
      // Check that enough time has elapsed before allowing jump key to restart.
      const deltaTime = getTimeStamp() - this.time;

      if (
        this.isCanvasInView() &&
        (Runner.keycodes.RESTART[keyCode] ||
          this.isLeftClickOnCanvas(e) ||
          (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
            Runner.keycodes.JUMP[keyCode]))
      ) {
        this.handleGameOverClicks(e);
      }
    } else if (this.paused && isjumpKey) {
      // Reset the jump state
      this.tRex.reset();
      this.play();
    }
  }

  /**
   * Handle interactions on the game over screen state.
   * A user is able to tap the high score twice to reset it.
   * @param {Event} e
   */
  handleGameOverClicks(e) {
    if (e.target !== this.slowSpeedCheckbox) {
      e.preventDefault();
      if (this.distanceMeter.hasClickedOnHighScore(e) && this.highestScore) {
        if (this.distanceMeter.isHighScoreFlashing()) {
          // Subsequent click, reset the high score.
          this.saveHighScore(0);
          this.distanceMeter.resetHighScore();
        } else {
          // First click, flash the high score.
          this.distanceMeter.startHighScoreFlashing();
        }
      } else {
        this.distanceMeter.cancelHighScoreFlashing();
        this.restart();
      }
    }
  }

  /**
   * Returns whether the event was a left click on canvas.
   * On Windows right click is registered as a click.
   * @param {Event} e
   * @return {boolean}
   */
  isLeftClickOnCanvas(e) {
    return (
      e.button != null &&
      e.button < 2 &&
      e.type === Runner.events.POINTERUP &&
      (e.target === this.canvas ||
        (IS_MOBILE && Runner.audioCues && e.target === this.containerEl))
    );
  }

  /**
   * RequestAnimationFrame wrapper.
   */
  scheduleNextUpdate() {
    if (!this.updatePending) {
      this.updatePending = true;
      this.raqId = requestAnimationFrame(this.update.bind(this));
    }
  }

  /**
   * Whether the game is running.
   * @return {boolean}
   */
  isRunning() {
    return !!this.raqId;
  }

  /**
   * Set the initial high score as stored in the user's profile.
   * @param {number} highScore
   */
  initializeHighScore(highScore) {
    highScore = Math.ceil(highScore);
    if (highScore < this.highestScore) return;
    this.highestScore = highScore;
    this.distanceMeter.setHighScore(this.highestScore);
  }

  /**
   * Sets the current high score and saves to the profile if available.
   * @param {number} distanceRan Total distance ran.
   */
  saveHighScore(distanceRan) {
    this.highestScore = Math.ceil(distanceRan);
    this.distanceMeter.setHighScore(this.highestScore);

  }

  /**
   * Game over state.
   */
  gameOver() {
    this.playSound(this.soundFx.HIT);
    vibrate(200);

    this.stop();
    this.crashed = true;
    this.distanceMeter.achievement = false;

    this.tRex.update(100, Trex.status.CRASHED);

    // Game over panel.
    if (!this.gameOverPanel) {
      const origSpriteDef = IS_HIDPI
        ? spriteDefinitionByType.original.HDPI
        : spriteDefinitionByType.original.LDPI;

      if (this.canvas) {
        if (Runner.isAltGameModeEnabled) {
          this.gameOverPanel = new GameOverPanel(
            this.canvas,
            origSpriteDef.TEXT_SPRITE,
            origSpriteDef.RESTART,
            this.dimensions,
            origSpriteDef.ALT_GAME_END,
            this.altGameModeActive
          );
        } else {
          this.gameOverPanel = new GameOverPanel(
            this.canvas,
            origSpriteDef.TEXT_SPRITE,
            origSpriteDef.RESTART,
            this.dimensions
          );
        }
      }
    }

    this.gameOverPanel.draw(this.altGameModeActive, this.tRex);

    // Update the high score.
    if (this.distanceRan > this.highestScore) {
      this.saveHighScore(this.distanceRan);
    }

    // Reset the time clock.
    this.time = getTimeStamp();

    if (Runner.audioCues) {
      this.generatedSoundFx.stopAll();
      announcePhrase(
        `${getA11yString(A11Y_STRINGS.gameOver).replace(
          '$1',
          this.distanceMeter.getActualDistance(this.distanceRan).toString()
        )} ${getA11yString(A11Y_STRINGS.highScore).replace(
          '$1',

          this.distanceMeter.getActualDistance(this.highestScore).toString()
        )}`
      );
      this.containerEl.setAttribute(
        'title',
        getA11yString(A11Y_STRINGS.ariaLabel)
      );
    }
    this.showSpeedToggle();
    this.disableSpeedToggle(false);
    this.options.onGameOver?.(
      this.highestScore,
      this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan))
    );
  }

  stop() {
    this.setPlayStatus(false);
    this.paused = true;
    cancelAnimationFrame(this.raqId);
    this.raqId = 0;
    this.generatedSoundFx?.stopAll();
  }

  play() {
    if (!this.crashed) {
      this.setPlayStatus(true);
      this.paused = false;
      this.tRex.update(0, Trex.status.RUNNING);
      this.time = getTimeStamp();
      this.update();
      this.generatedSoundFx.background();
    }
  }

  restart() {
    if (!this.raqId) {
      this.playCount++;
      this.runningTime = 0;
      this.setPlayStatus(true);
      this.toggleSpeed();
      this.paused = false;
      this.crashed = false;
      this.distanceRan = 0;
      this.setSpeed(this.config.SPEED);
      this.time = getTimeStamp();
      this.containerEl.classList.remove(Runner.classes.CRASHED);
      this.clearCanvas();
      this.distanceMeter.reset();
      this.horizon.reset();
      this.tRex.reset();
      this.playSound(this.soundFx.BUTTON_PRESS);
      this.invert(true);
      this.flashTimer = null;
      this.update();
      this.gameOverPanel?.reset();
      this.generatedSoundFx.background();
      this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.jump));
      announcePhrase(getA11yString(A11Y_STRINGS.started));
    }
  }

  setPlayStatus(isPlaying) {
    if (this.touchController) {
      this.touchController.classList.toggle(HIDDEN_CLASS, !isPlaying);
    }
    this.playing = isPlaying;
  }

  /**
   * Play a sound.
   * @param {AudioBuffer} soundBuffer
   */
  playSound(soundBuffer) {
    if (soundBuffer) {
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = soundBuffer;
      sourceNode.connect(this.audioContext.destination);
      sourceNode.start(0);
    }
  }

  /**
   * Inverts the current page / canvas colors.
   * @param {boolean} reset Whether to reset colors.
   */
  invert(reset) {
    this.inverted = reset ? false : Boolean(this.invertTrigger);
    if (reset) this.invertTimer = 0;
  }

  /**
   * Destroy the game and works as a cleanup function
   */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    this.stopListening();
    this.gameOverPanel?.reset();
    this.distanceMeter?.cancelHighScoreFlashing();
    this.audioAbort?.abort();
    for (const context of [this.audioContext, this.generatedSoundFx?.context]) {
      if (context && context.state !== 'closed') {
        context.onstatechange = null;
        context.close().catch(() => {});
      }
    }
    this.touchController?.remove();
    this.a11yStatusEl?.remove();
    this.containerEl?.remove();
    setRunnerState(null);
  }

}

// ------------------------------------------------------------------------------

/**
 * Speak a phrase using Speech Synthesis API for a11y.
 * @param {string} phrase Sentence to speak.
 */
function speakPhrase(phrase) {
  if ('speechSynthesis' in window) {
    const msg = new SpeechSynthesisUtterance(phrase);
    const voices = window.speechSynthesis.getVoices();
    msg.text = phrase;
    speechSynthesis.speak(msg);
  }
}

/**
 * For screen readers make an announcement to the live region.
 * @param {string} phrase Sentence to speak.
 */
function announcePhrase(phrase) {
  if (Runner.a11yStatusEl) {
    Runner.a11yStatusEl.textContent = '';
    Runner.a11yStatusEl.textContent = phrase;
  }
}

/**
 * Returns a string from loadTimeData data object.
 * @param {string} stringName
 * @return {string}
 */
function getA11yString(stringName) {
  return loadTimeData && loadTimeData.valueExists(stringName)
    ? loadTimeData.getString(stringName)
    : '';
}

/**
 * Vibrate on mobile devices.
 * @param {number} duration Duration of the vibration in milliseconds.
 */
function vibrate(duration) {
  if (IS_MOBILE && window.navigator.vibrate) {
    window.navigator.vibrate(duration);
  }
}

/**
 * Create canvas element.
 * @param {Element} container Element to append canvas to.
 * @param {number} width
 * @param {number} height
 * @param {string=} opt_classname
 * @return {HTMLCanvasElement}
 */
function createCanvas(container, width, height, opt_classname) {
  const canvas = /** @type {!HTMLCanvasElement} */ (
    document.createElement('canvas')
  );
  canvas.className = opt_classname
    ? `${Runner.classes.CANVAS} ${opt_classname}`
    : Runner.classes.CANVAS;
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);

  return canvas;
}

/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 * @param {string} base64String
 */
function decodeBase64ToArrayBuffer(base64String) {
  const len = (base64String.length / 4) * 3;
  const str = atob(base64String);
  const arrayBuffer = new ArrayBuffer(len);
  const bytes = new Uint8Array(arrayBuffer);

  for (let i = 0; i < len; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes.buffer;
}

// *****************************************************************************

/**
 * Check for a collision.
 * @param {!Obstacle} obstacle
 * @param {!Trex} tRex T-rex object.
 * @param {CanvasRenderingContext2D=} opt_canvasCtx Optional canvas context for
 *    drawing collision boxes.
 * @return {Array<CollisionBox>|undefined}
 */
function checkForCollision(obstacle, tRex, opt_canvasCtx) {
  const obstacleBoxXPos = Runner.defaultDimensions.WIDTH + obstacle.xPos;

  // Adjustments are made to the bounding box as there is a 1 pixel white
  // border around the t-rex and obstacles.
  const tRexBox = new CollisionBox(
    tRex.xPos + 1,
    tRex.yPos + 1,
    tRex.config.WIDTH - 2,
    tRex.config.HEIGHT - 2
  );

  const obstacleBox = new CollisionBox(
    obstacle.xPos + 1,
    obstacle.yPos + 1,
    obstacle.typeConfig.width * obstacle.size - 2,
    obstacle.typeConfig.height - 2
  );

  // Debug outer box
  if (opt_canvasCtx) {
    drawCollisionBoxes(opt_canvasCtx, tRexBox, obstacleBox);
  }

  // Simple outer bounds check.
  if (boxCompare(tRexBox, obstacleBox)) {
    const { collisionBoxes } = obstacle;
    let tRexCollisionBoxes = [];

    if (Runner.isAltGameModeEnabled()) {
      tRexCollisionBoxes = Runner.spriteDefinition.TREX.COLLISION_BOXES;
    } else {
      tRexCollisionBoxes = tRex.ducking
        ? Trex.collisionBoxes.DUCKING
        : Trex.collisionBoxes.RUNNING;
    }

    // Detailed axis aligned box check.
    for (let t = 0; t < tRexCollisionBoxes.length; t++) {
      for (let i = 0; i < collisionBoxes.length; i++) {
        // Adjust the box to actual positions.
        const adjTrexBox = createAdjustedCollisionBox(
          tRexCollisionBoxes[t],
          tRexBox
        );
        const adjObstacleBox = createAdjustedCollisionBox(
          collisionBoxes[i],
          obstacleBox
        );
        const crashed = boxCompare(adjTrexBox, adjObstacleBox);

        // Draw boxes for debug.
        if (opt_canvasCtx) {
          drawCollisionBoxes(opt_canvasCtx, adjTrexBox, adjObstacleBox);
        }

        if (crashed) {
          return [adjTrexBox, adjObstacleBox];
        }
      }
    }
  }
}

/**
 * Adjust the collision box.
 * @param {!CollisionBox} box The original box.
 * @param {!CollisionBox} adjustment Adjustment box.
 * @return {CollisionBox} The adjusted collision box object.
 */
function createAdjustedCollisionBox(box, adjustment) {
  return new CollisionBox(
    box.x + adjustment.x,
    box.y + adjustment.y,
    box.width,
    box.height
  );
}

/**
 * Draw the collision boxes for debug.
 */
function drawCollisionBoxes(canvasCtx, tRexBox, obstacleBox) {
  canvasCtx.save();
  canvasCtx.strokeStyle = '#f00';
  canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height);

  canvasCtx.strokeStyle = '#0f0';
  canvasCtx.strokeRect(
    obstacleBox.x,
    obstacleBox.y,
    obstacleBox.width,
    obstacleBox.height
  );
  canvasCtx.restore();
}

/**
 * Compare two collision boxes for a collision.
 * @param {CollisionBox} tRexBox
 * @param {CollisionBox} obstacleBox
 * @return {boolean} Whether the boxes intersected.
 */
function boxCompare(tRexBox, obstacleBox) {
  let crashed = false;
  const tRexBoxX = tRexBox.x;
  const tRexBoxY = tRexBox.y;

  const obstacleBoxX = obstacleBox.x;
  const obstacleBoxY = obstacleBox.y;

  // Axis-Aligned Bounding Box method.
  if (
    tRexBox.x < obstacleBoxX + obstacleBox.width &&
    tRexBox.x + tRexBox.width > obstacleBoxX &&
    tRexBox.y < obstacleBox.y + obstacleBox.height &&
    tRexBox.height + tRexBox.y > obstacleBox.y
  ) {
    crashed = true;
  }

  return crashed;
}
