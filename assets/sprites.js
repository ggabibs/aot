/* Attack of Hunger — sprite atlas metadata (user-provided artwork). */
(function (root, factory) {
  'use strict';
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HungerSprites = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
  "src": "./assets/sprites.png",
  "width": 1024,
  "height": 1296,
  "frames": {
    "player_idle": {
      "x": 4,
      "y": 4,
      "w": 200,
      "h": 512
    },
    "player_eat": {
      "x": 208,
      "y": 4,
      "w": 202,
      "h": 512
    },
    "rival_beast": {
      "x": 414,
      "y": 4,
      "w": 198,
      "h": 384
    },
    "rival_armored": {
      "x": 616,
      "y": 4,
      "w": 159,
      "h": 384
    },
    "human_0": {
      "x": 779,
      "y": 4,
      "w": 126,
      "h": 384
    },
    "human_1": {
      "x": 4,
      "y": 520,
      "w": 189,
      "h": 384
    },
    "human_2": {
      "x": 197,
      "y": 520,
      "w": 136,
      "h": 384
    },
    "human_3": {
      "x": 337,
      "y": 520,
      "w": 144,
      "h": 384
    },
    "human_4": {
      "x": 485,
      "y": 520,
      "w": 299,
      "h": 384
    },
    "human_5": {
      "x": 788,
      "y": 520,
      "w": 199,
      "h": 384
    },
    "human_6": {
      "x": 4,
      "y": 908,
      "w": 139,
      "h": 384
    }
  }
};
});
