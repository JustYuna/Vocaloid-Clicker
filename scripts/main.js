/* • • • • • • • • • • • • • • • •
Copyright (C) 2026 Yuna2077 - All rights Reserved
You may use, distribute or modify this code under the terms of AGPLv3 license.
    License: https://choosealicense.com/licenses/agpl-3.0/
 • • • • • • • • • • • • • • • • */

// https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
function utf8_to_b64(str) {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    }));
  }
  catch (err) { return ''; }
};

function b64_to_utf8(str) {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''));
  }
  catch (err) { return ''; }
};


function escapeRegExp(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); };
function escapeSpace(str) { return str.replace(" ", ""); }; // seems like what i needed was so easy to make
function chooseArray(arr) { return arr[Math.floor(Math.random()*arr.length)]; };


var game = {};

game.saveTo = "VolcaloidClickerGame";
game.mouse = { X: 0, Y: 0 };
game.cache = {};

// • • • • • • • • • • • • • • • •
// Helper Functions
// • • • • • • • • • • • • • • • •

game.helper = {};
game.helper.format = {
  /**
   * Abbreviates a number example 1234 -> 1.23K
   * 
   * @param {input} number - The number to format
   * @returns {string} Formatted number (e.g., "1,23K")
   */
  abbreviate: (input) => {
    if (input < 1000) return input.toString();

    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi"];
    const suffixNum = Math.floor((String(Math.floor(input)).length - 1) / 3);

    const scaled = input / Math.pow(1000, suffixNum);

    let formatted = scaled.toPrecision(3);

    formatted = parseFloat(formatted).toString();

    return formatted + suffixes[suffixNum];
  }
};
game.helper.getImage = {
  
};
game.helper.math = {
  /**
   * Returns the price of given data via upgrade formula
   * 
   * @param {basePrice} number - Base price of item
   * @param {owns} number - How much the user owns
   * @param {amount} number - How many are being attempted to purchase
   * @return {number} - Calculated price 
   */
  calculateUpgradeCost: (basePrice, owns, amount) => {
    var price = 0;
    do {
      price += basePrice * Math.pow(1.2, owns);
      amount--;
      owns++;
    } while (amount > 0);
    return Math.round(price)
  },

  clickAmount: () => {
    var a = game.data.clickIncome;
    a *= game.data.clickMultiplier;
    return a
  }
};

// • • • • • • • • • • • • • • • •
// Storage Helper
// • • • • • • • • • • • • • • • •

game.storage = {
  save: function () {
    /*
    var data = JSON.stringify(game.data);
    var date = new Date();
    date.setTime(date.getDate() + (3640 * 24 * 60 * 60 * 1000));
    var expires = "; expires=" + date.toUTCString();
    document.cookie = "cookie=" + data + expires;
    console.log("Data saved\n" + "cookie=" + data + expires)
    */ // cookies truly suck to use...

    var str = JSON.stringify(game.data);
    str = utf8_to_b64(str) + '!END!';
    if (str.length < 10) {
      console.warn("Saving failed")
    }
    else {
      str = escape(str);

      try {
        local = window.localStorage.setItem(game.saveTo, str);
      } catch (expection) { };

      game.note.new("Game saved", "", "", 4);
    }
  },

  getRaw: function () {
    var local = 0;

    try {
      local = window.localStorage.getItem(game.saveTo)
    } catch (expection) { };

    console.log(local);
    return local;
  },

  get: function () {
    var str = "";
    var local = 0;

    try {
      local = window.localStorage.getItem(game.saveTo)
    } catch (expection) { };

    if (!local) return; // no save

    str = unescape(local);
    if (str == "") return; // still no save >:v

    str = str.split('!END!')[0];
    str = b64_to_utf8(str);

    return str;
  },

  reset: function () {
    window.localStorage.clear();
    location.reload();
    // lazy ah aproach
  }
}

// • • • • • • • • • • • • • • • •
//  Animator
// • • • • • • • • • • • • • • • •

game.animator = {
  data: [],
  add: function(element, data, time) {
    var me = {
      data: data,
      life: time * game.tick,
    };

    game.animator.data.push(me);
  },
  logic: function() {
    
  }
};

// • • • • • • • • • • • • • • • •
// Notifications
// • • • • • • • • • • • • • • • •

// the great cookie man said note so i am continuing this name scheeme aswell but rewrite basically how it works instead of straight copying it
game.note = {
  notes: [],
  notesById: [],
  idCounter: 0,
  new: function (title, desc, icon, lifeCycles) {
    var me = {};
    me.title = title;
    me.desc = desc;
    me.icon = icon | "";
    me.life = lifeCycles * game.tick; // 1 cycle = 1 second cause why not
    me.id = "note-" + game.note.idCounter;
    me.document = `<button onclick="game.note.remove('`+me.id+`')"; id="${me.id}"; class="note">
                      <div class="title"; style="height: 70%;">${me.title}</div>
                      <div class="small title"; style="height: 30%;">${me.desc}</div>
                    </button>`;
    game.note.idCounter++;
    document.querySelector("#notes").innerHTML+=me.document;

    game.note.notes[me.id] = me; // this. is stupid and seemed to not work for this use case... or i am stupid no one knows

  },

  remove: function (id) {
    if (game.note.notes[id]) game.note.notes[id].life = 0;
  },

  removeAll: function () {
    game.note.notes = {};
    document.querySelector("#notes").innerHTML = "";
  },

  logic: function () {
    for (var [_, me] of Object.entries(game.note.notes)) {
      me.life--;
      if (me.life < 0) {
        const e = document.querySelector("#"+me.id);
        if (e) {
          e.remove();
          me.element = null;
        } else delete game.note.notes[me.id];
      };
    };
  }
};

// • • • • • • • • • • • • • • • •
// Sync Helper
// • • • • • • • • • • • • • • • •

game.sync = {
  income: () => {
    var income = 0;

    for (i in game.data.products) {
      var data = game.data.products[i];
      var reward = (data.amount * data.income);
      income += reward;
    };

    game.data.income = income * game.data.incomeMultiplier;
  },

  products: (force) => {
    if (!game.cache.upgradeList) game.cache.upgradeList = {};
    var id = 0;

    var needsReset = force | false;
    for (i in game.data.products) {
      var me = game.data.products[i];
      var cached = game.cache.upgradeList[i];
      if (!cached) {
        game.cache.upgradeList[i] = { amount: 0, couldAfford: false, cost: 0 };
        cached = game.cache.upgradeList[i];
      };

      var price = game.helper.math.calculateUpgradeCost(me.cost, me.amount, game.tempData.purchaseAmount);
      var canAfford = game.data.songs >= price;

      var amountMatch = cached.amount == me.amount;
      var costMatch = cached.cost == price;
      var affordMatch = cached.couldAfford == canAfford;

      if (!amountMatch | !costMatch | !affordMatch) {
        needsReset = true;
        game.cache.upgradeList[i] = { amount: me.amount, couldAfford: canAfford, cost: price };
      };
    };

    if (!needsReset) return;
    document.querySelector("#products").innerHTML = "";

    for (i in game.data.products) {
      var data = game.data.products[i];
      var text = "Could not fetch";
      var cached = game.cache.upgradeList[i];
      if (!cached) continue;

      var price = cached.cost;
      var cost = game.helper.format.abbreviate(price);
      var income = game.helper.format.abbreviate(data.income);

      if (game.data.totalSongs < data.cost) {
        document.querySelector("#products").innerHTML += `<div class="product holder"; style="top: ${12 * id}%;">
                            <button class="product locked">
                              <div class="product title">???</div>
                              <div class="product title">???</div>
                              <div class="product amount">0</div>
                              <div class="product icon" style="background: url(${data.icon});"></div>
                            </button>
                        </div>`;
      } else {
        if (game.data.songs < price) {
          document.querySelector("#products").innerHTML += `<div class="product holder"; style="top: ${12 * id}%;">
                              <button class="product locked"; onclick="game.onClicked('buy_product', '${i}')">
                                <div class="product title">${data.name}</div>
                                <div class="product sub_title">${cost}</div>
                                <div class="product amount">${data.amount}</div>
                                <div class="product icon" style="background: url(${data.icon});"></div>
                              </button>
                          </div>`;
        } else {
          document.querySelector("#products").innerHTML += `<div class="product holder"; style="top: ${12 * id}%;">
                              <button class="product unlocked"; onclick="game.onClicked('buy_product', '${i}')">
                                <div class="product title">${data.name}</div>
                                <div class="product sub_title">${cost}</div>
                                <div class="product amount">${data.amount}</div>
                                <div class="product icon" style="background: url(${data.icon}); background-size: cover; "></div>
                              </button>
                          </div>`;
          };
      };

      id++;
    };
  },

  pointHeader: () => {
    var songs = game.helper.format.abbreviate(Math.round(game.data.songs));

    if (game.tempData.lastNoteTitle != songs) {
      game.tempData.lastNoteTitle = songs;
      document.querySelector("#points_current").innerHTML = songs + " Songs";
    };

    var perSecond = game.helper.format.abbreviate(Math.round(game.data.income));

    if (game.tempData.lastNotePerSecond != perSecond) {
      game.tempData.lastNotePerSecond = perSecond;
      document.querySelector("#points_per_second").innerHTML = "~ " + perSecond + " per second ~";
    };
  },

  all: () => {
    for (const [key, value] of Object.entries(game.sync)) {
      if (key != "all") {
        value();
      };
    };
  }
};

// • • • • • • • • • • • • • • • •
// Clove effects
// • • • • • • • • • • • • • • • •

game.cloveEffects = [
  award_50Procent=function(){const d=game.data.songs*0.5;game.data.songs+=d;game.data.totalSongs+=d;game.note.new("~ Clove ~", "+"+game.helper.format.abbreviate(Math.round(d))+" Songs");},
  award_50Procent=function(){const d=game.data.songs*0.5;game.data.songs+=d;game.data.totalSongs+=d;game.note.new("~ Clove ~", "+"+game.helper.format.abbreviate(Math.round(d))+" Songs");},
  award_50Procent=function(){const d=game.data.songs*0.5;game.data.songs+=d;game.data.totalSongs+=d;game.note.new("~ Clove ~", "+"+game.helper.format.abbreviate(Math.round(d))+" Songs");},
  x2_600sec=function(){game.data.clove.boost=2;game.data.clove.life=600*game.tick;game.note.new("~ Clove ~", "x2 Songs for 600sec");},
  x2_600sec=function(){game.data.clove.boost=2;game.data.clove.life=600*game.tick;game.note.new("~ Clove ~", "x2 Songs for 600sec");},
  x2_600sec=function(){game.data.clove.boost=2;game.data.clove.life=600*game.tick;game.note.new("~ Clove ~", "x2 Songs for 600sec");},
  x7_300sec=function(){game.data.clove.boost=7;game.data.clove.life=300*game.tick;game.note.new("~ Clove ~", "x7 Songs for 300sec");}
];

// • • • • • • • • • • • • • • • •
// Main settings
// • • • • • • • • • • • • • • • •

game.tick = 30;
game.cache.clove = 0;
game.delays = {
  master: 0,
  save: {
    delay: 0,
    interval: 60, // 1 = 1sec
    perform: function() {
      game.storage.save();
    }
  },
  guiSync: {
    delay: 0,
    interval: 1,
    perform: function() {
      game.sync.products();
    }
  },
  siteTitle: {
    delay: 0,
    interval: 5,
    perform: function() {
      document.title = game.helper.format.abbreviate(Math.round(game.data.songs)) + " songs - Vocaloid Clicker";
    }
  },
  time: {
    delay: 0,
    interval: 1,
    perform: function() {
      game.data.secondsPassed++;
    }
  },
  clove: {
    delay: 0,
    interval: 5,
    perform: function() {
      game.cache.clove++;
      var id="clove"+game.cache.clove;
      var s=Math.max(Math.random()*100, 35);
      var d = document.createElement("div");
      d.id=id;
      d.style=`position: absolute; left: ${Math.round(Math.random() * 500)}px; bottom: ${Math.round(Math.random() * 500)}px;`
      d.innerHTML=`<div style="z-index: 99; background: url(../assets/img/klee.png); background-size: cover; width: ${s}px; height: ${s}px;"></div>`;
      document.body.appendChild(d);
      d.onclick = function() {
        var d=document.querySelector("#"+id)?.remove();
        var e=chooseArray(game.cloveEffects);
        do {e=chooseArray(game.cloveEffects);} while (!e);
        e();
      };
      setTimeout(function(){
        var d=document.querySelector("#"+id)?.remove();
      }, 5000);
    }
  }
};
game.loaded = false;

// • • • • • • • • • • • • • • • •
// Data
// • • • • • • • • • • • • • • • •

game.tempData = {
  purchaseAmount: 1,
  lastNoteTitle: "",
  lastNotePerSecond: ""
};
game.data = {
  songs: 0,
  totalSongs: 0,
  clicked: 0,
  secondsPassed: 0,
  income: 0,
  incomeMultiplier: 1,
  clickIncome: 1,
  clickMultiplier: 1,
  rampage: false,
  rampageMultiplierClick: 1,
  rampageMultiplierIncome: 1,
  clove: { life: 0, boost: 0 },
  cloveClicked: 0,
  products: {},
  achievements: {}
};

// • • • • • • • • • • • • • • • •
// Add to data
// • • • • • • • • • • • • • • • •

game.products = {
  id: 0,
  new: function (name, desc, cost, income, icon) {
    var me = {};
    me.id = game.products.id;
    me.name = name;
    me.desc = desc;
    me.cost = cost;
    me.income = income;
    me.amount = 0;
    me.icon = icon;
    game.products.id++;

    game.data.products[escapeSpace(name)] = me;
  }
};

{ // hope this makes managing data easier
  game.products.new("Hatsune Miku", "Migu is cuter anyways...", 10, 1, "../assets/img/unkown.png");
  game.products.new("Kagamine Twins", "Just like Kagamine Len", 100, 2, "../assets/img/unkown.png");
  game.products.new("Magurine Luka", "The fish will never be forgotten", 1_250, 8, "../assets/img/unkown.png");
  game.products.new("Hakaine Maiko", "Perfection!", 13_500, 50, "../assets/img/unkown.png");
  game.products.new("Kamui Gakupo", "Purple eggplant freak", 140_000, 250, "../assets/img/unkown.png");
  game.products.new("Gumi", "In circles in circles", 1_500_000, 750, "../assets/img/unkown.png");
  game.products.new("Flower", "Moves pretty abnormaly", 7_500_000, 3_000, "../assets/img/unkown.png");
  game.products.new("Oliver", "Steam powered", 25e6, 10_000, "../assets/img/vocaloids/Oliver@Rory.png");
  game.products.new("Yazuki Yukari", "Sent a rabbit to moon", 100e6, 30_000, "../assets/img/unkown.png");
  game.products.new("Kasane Teto", "Eats baguettes and produces songs", 600e6, 75_000, "../assets/img/unkown.png");
  game.products.new("Kaai Yuki", "ITS FREAKIM WIMDY", 2.5e9, 125_000, "../assets/img/unkown.png");
  game.products.new("Song Factory", "Just like ai, no one likes it but its here.", 45e9, 250_000, "../assets/img/unkown.png");
};

game.achievements = {
  id: 0,
  // this useless function will mainly be used for startup exclusivly to add em achievements
  new: function (name, desc) {
    var me = {};
    me.id = game.achievements.id;
    me.name = name;
    me.desc = desc;
    me.earned = false;
    game.achievements.id++;

    if (game.data.achievements[escapeSpace(name)]) return console.warn("Achievement with name " + name + " already exists")
    game.data.achievements[escapeSpace(name)] = me
  },
  newTiered: function (name, desc, objective, param) {
    var me = {};
    me.id = game.achievements.id;
    me.name = name;
    me.earned = false;
    game.achievements.id++;

    if (typeof param == "number") {
      var amounts = [1, 50, 100];
      str = "Have " + amounts[param] + " " + objective;
    } else { // there it is... params that i prob never will use again
      var todo = param.todo;
      var extra = param.extra;
      if (!extra) extra = [];
      var str = "";
      if (!todo) {
        console.warn("Incomplete tiered todo", name, desc, objective, param);
        return false;
      };

      if (todo == "overwrite") {
        if (extra.includes("no_abbreviate")) {// uuh yes
          str = "Have " + param.amount + " " + objective;
        } else {
          str = "Have " + game.helper.format.abbreviate(param.amount) + " " + objective;
        };
      };
    };

    if (desc == "") { me.desc = str; } else me.desc = desc;

    if (game.data.achievements[escapeSpace(name)]) return console.warn("Achievement with name " + name + " already exists")
    game.data.achievements[escapeSpace(name)] = me;
  },
  award: function (name) {
    if (!game.data.achievements[escapeSpace(name)]) return console.log("Trying to set null achievement "+escapeSpace(name)+" "+name);
    if (game.data.achievements[escapeSpace(name)]?.earned) return;

    game.note.new("~ Achievement Unlocked ~", name, "", 120);
    game.data.achievements[escapeSpace(name)].earned = true;
  }
};

{
  game.achievements.newTiered("First song", "Earn your first song", "", 0);
  game.achievements.newTiered("Small published", "", "songs", 2);
  game.achievements.newTiered("Song production", "", "songs", { todo: "overwrite", amount: 1_000 });
  game.achievements.newTiered("VIP", "Earn 1337 songs", "", { todo: "overwrite", amount: 1337, extra: ["no_abbreviate"] });
  game.achievements.newTiered("Silver", "Earn 100.000 songs", "", { todo: "overwrite", amount: 100_000 });
  game.achievements.newTiered("Golden", "Earn 1.000.000 songs", "", { todo: "overwrite", amount: 1_000_000 });
  game.achievements.newTiered("Diamond", "Earn 1 Billion songs", "", { todo: "overwrite", amount: 1_000_000_000 });

  game.achievements.id=100;
  game.achievements.new("Button", "Click the button once");
  game.achievements.new("Double Click", "Click the button twice");
  game.achievements.new("Clicker", "Click the button 100 times");
  game.achievements.new("Clicktastic", "Click the button 1.000 Times");
  game.achievements.new("Master of Clicks", "Click the button 10.000 Times");
  game.achievements.new("Finger of steel", "Click the button 100.000 Times");

  game.achievements.id=10000;
  game.achievements.newTiered("Hatsune Miku", "", "Hatsune Miku", 0);
  game.achievements.newTiered("Self made man", "", "Hatsune Miku", 1);
  game.achievements.newTiered("Migu was here", "", "Hatsune Miku", 2);

  game.achievements.newTiered("Kagamine Twins", "", "Kagamine Twins", 0);
  game.achievements.newTiered("2 for 1", "", "Kagamine Twins", 1);
  game.achievements.newTiered("ADDIKT ADDIKT", "", "Kagamine Twins", 2);

  game.achievements.newTiered("Magurine Luka", "", "Magurine Luka", 0);
  game.achievements.newTiered("Last of Me", "", "Magurine Luka", 1);
  game.achievements.newTiered("Tako Luka Maguro Fever", "", "Magurine Luka", 2);

  game.achievements.newTiered("Hakaine Maiko", "", "Hakaine Maiko", 0);
  game.achievements.newTiered("Rebound", "", "Hakaine Maiko", 1);
  game.achievements.newTiered("Silver Shirley", "", "Hakaine Maiko", 2);

  game.achievements.newTiered("Kamui Gakupo", "", "Kamui Gakupo", 0);
  game.achievements.newTiered("ACUTE", "", "Kamui Gakupo", 1);
  game.achievements.newTiered("Dancing Samurai", "", "Kamui Gakupo", 2);

  game.achievements.newTiered("Gumi", "", "Gumi", 0);
  game.achievements.newTiered("I Feed", "", "Gumi", 1);
  game.achievements.newTiered("In circles in circles", "", "Gumi", 2);

  game.achievements.newTiered("Flower", "", "Flower", 0);
  game.achievements.newTiered("Abnormaly Dancing Girl", "", "Flower", 1);
  game.achievements.newTiered("Protodisco", "", "Flower", 2);

  game.achievements.newTiered("Oliver", "", "Oliver", 0);
  game.achievements.newTiered("The Detective", "", "Oliver", 1);
  game.achievements.newTiered("Candle Boy", "", "Oliver", 2);

  game.achievements.newTiered("Yazuki Yukari", "", "Yazuki Yukari", 0);
  game.achievements.newTiered("Guillotine", "", "Yazuki Yukari", 1);
  game.achievements.newTiered("Stardust", "", "Yazuki Yukari", 2);

  game.achievements.newTiered("Kasane Teto", "", "Kasane Teto", 0);
  game.achievements.newTiered("Baguette Lover", "", "Kasane Teto", 1);
  game.achievements.newTiered("Teto Territory", "", "Kasane Teto", 2);

  game.achievements.newTiered("Song Factory", "", "Song Factory", 0);
  game.achievements.newTiered("Steady Production", "", "Song Factory", 1);
  game.achievements.newTiered("Booming Production", "", "Song Factory", 2);
};

game.clickFunctions = {
  buy_product: function(name) {
    var data = game.data.products[escapeSpace(name)];

    if (!data) {
      console.warn("No data found for upgrade: " + escapeSpace(name));
      return;
    };

    var price = game.helper.math.calculateUpgradeCost(data.cost, data.amount, game.tempData.purchaseAmount);
    if (game.data.songs < price) return;

    game.data.songs -= price;
    data.amount += game.tempData.purchaseAmount;
    game.sync.income();
    game.sync.products();

    // idk how efficient this is but ill roll with it for now
    // NOTE: its fair enough
    var a = escapeSpace("Hatsune Miku");
    if (game.data.products[a].amount > 0) game.achievements.award("Hatsune Miku");
    if (game.data.products[a].amount > 49) game.achievements.award("Self made man");
    if (game.data.products[a].amount > 99) game.achievements.award("Migu was here");

    a = escapeSpace("Kagamine Twins");
    if (game.data.products[a].amount > 0) game.achievements.award("Kagamine Twins");
    if (game.data.products[a].amount > 49) game.achievements.award("2 for 1");
    if (game.data.products[a].amount > 99) game.achievements.award("ADDIKT ADDIKT");

    a = escapeSpace("Magurine Luka");
    if (game.data.products[a].amount > 0) game.achievements.award("Magurine Luka");
    if (game.data.products[a].amount > 49) game.achievements.award("Last of Me");
    if (game.data.products[a].amount > 99) game.achievements.award("Tako Luka Maguro Fever");

    a = escapeSpace("Hakaine Maiko");
    if (game.data.products[a].amount > 0) game.achievements.award("Hakaine Maiko");
    if (game.data.products[a].amount > 49) game.achievements.award("Rebound");
    if (game.data.products[a].amount > 99) game.achievements.award("Silver Shirley");

    a = escapeSpace("Kamui Gakupo");
    if (game.data.products[a].amount > 0) game.achievements.award("Kamui Gakupo");
    if (game.data.products[a].amount > 49) game.achievements.award("ACUTE");
    if (game.data.products[a].amount > 99) game.achievements.award("Dancing Samurai");

    a = escapeSpace("Gumi");
    if (game.data.products[a].amount > 0) game.achievements.award("Gumi");
    if (game.data.products[a].amount > 49) game.achievements.award("I Feed");
    if (game.data.products[a].amount > 99) game.achievements.award("In circles in circles");

    a = escapeSpace("Flower");
    if (game.data.products[a].amount > 0) game.achievements.award("Flower");
    if (game.data.products[a].amount > 49) game.achievements.award("Abnormaly Dancing Girl");
    if (game.data.products[a].amount > 99) game.achievements.award("Protodisco");

    a = escapeSpace("Oliver");
    if (game.data.products[a].amount > 0) game.achievements.award("Oliver");
    if (game.data.products[a].amount > 49) game.achievements.award("The Detective");
    if (game.data.products[a].amount > 99) game.achievements.award("Candle Boy");

    a = escapeSpace("Yazuki Yukari");
    if (game.data.products[a].amount > 0) game.achievements.award("Yazuki Yukari");
    if (game.data.products[a].amount > 49) game.achievements.award("Guillotine");
    if (game.data.products[a].amount > 99) game.achievements.award("Stardust");

    a = escapeSpace("Kasane Teto");
    if (game.data.products[a].amount > 0) game.achievements.award("Kasane Teto");
    if (game.data.products[a].amount > 49) game.achievements.award("Baguette Lover");
    if (game.data.products[a].amount > 99) game.achievements.award("Teto Territory");

    a = escapeSpace("Song Factory");
    if (game.data.products[a].amount > 0) game.achievements.award("Song Factory");
    if (game.data.products[a].amount > 49) game.achievements.award("Steady Production");
    if (game.data.products[a].amount > 99) game.achievements.award("Booming Production");
  },

  changeBulk: function(amount) {
    var valid = [1, 10, 100];
    if (!valid.includes(amount)) return;

    document.querySelector(`#bulkButton${amount}`).className = "bulkButtonSelected";
    document.querySelector(`#bulkButton${game.tempData.purchaseAmount}`).className = "bulkButton";

    game.tempData.purchaseAmount = amount;
    game.sync.products(true);
  },

  mainButton: function() {
    var a = game.helper.math.clickAmount();
    game.data.songs += a;
    game.data.totalSongs += a;
    game.data.clicked++;


    if (game.data.clicked>0) game.achievements.award("Button");
    if (game.data.clicked>1) game.achievements.award("Double Click");
    if (game.data.clicked>99) game.achievements.award("Clicker");
    if (game.data.clicked>999) game.achievements.award("Clicktastic");
    if (game.data.clicked>9_999) game.achievements.award("Master of Clicks");
    if (game.data.clicked>99_999) game.achievements.award("Finger of steel");
    /*
    var d = document.createElement("div");
    d.className = "buttonClickEffect";
    d.style.top = game.mouse.Y + "px";
    d.style.left = game.mouse.X + "px";
    d.innerHTML = "+" + game.helper.format.abbreviate(a);
    document.body.appendChild(d);
	  d.addEventListener('animationend',function() {
      d.parentElement.removeChild(d);
    }.bind(this));
    */
  }
};

game.onClicked = function (Todo, Data) {
  if (!game.loaded) {
    console.warn("onClick rejected, waiting to load data...", "onClicked")
    return
  };

  if (game.clickFunctions[Todo]) {
    game.clickFunctions[Todo](Data);
  } else {
    console.error("Called invalid function: " + Todo + "\nData: " + Data);
  };
};

// • • • • • • • • • • • • • • • •
// Update Logs
// • • • • • • • • • • • • • • • •

game.logs = {
  data: "",
  add: function(v,arr) {
    game.logs.data+="<h2>"+v+"</h2>";
    var d = ["p", "h3"]
    for (var me of arr) {
      game.logs.data+=`<${d[me.size]}>`+me.text+`</${d[me.size]}>`
    };
    game.logs.data+="<br>";
  }
};

{
  game.logs.add("2026.08.28", [
    { text: "Added clovers with no game mechanic yet.", size: 0 },
    { text: "Notes have a hover effect now.", size: 0 }
  ]);
  game.logs.add("2026.08.26", [
    { text: "Added logs.", size: 0 },
    { text: "Notes can be removed by clicking them now.", size: 0 },
    { text: "Fixed achievement errors", size: 0 },
    { text: "Made data more save", size: 0 },
    { text: "Achievements for clicking the button", size: 0 }
  ]);
  game.logs.add("2026.08.25", [
    { text: "Added better indicator for when you can afford products.", size: 0 },
    { text: "Added contribution tab to topbar.", size: 0 },
    { text: "Fixed afford visualizer going of base price not current.", size: 0 }
  ]);
  game.logs.add("2026.08.24", [
    { text: "Game shows now the version.", size: 0 },
    { text: "Internal click boost for future upgrades.", size: 0 },
    { text: "Data handling ugprades.", size: 0 }
  ]);
};

game.loop = function () {
  game.sync.all();

  setInterval(() => {
    if (!game.loaded) return false;

    game.data.songs += game.data.income / game.tick;
    game.data.totalSongs += game.data.income / game.tick;
    game.sync.pointHeader();

    if (game.data.totalSongs>0) game.achievements.award("First song");
    if (game.data.totalSongs>99) game.achievements.award("Small published");
    if (game.data.totalSongs>999) game.achievements.award("Song production");
    if (game.data.totalSongs>1336) game.achievements.award("VIP");
    if (game.data.totalSongs>99_999) game.achievements.award("Silver");
    if (game.data.totalSongs>999_999) game.achievements.award("Golden");
    if (game.data.totalSongs>9_999_999) game.achievements.award("Diamond");

    game.delays.master++;
    if (game.delays.master > game.tick-1)
    {
      game.delays.master=0;
      for (const [key, value] of Object.entries(game.delays)) {
        if (key=="master")continue;
        value.delay++;
        if (value.delay > value.interval) {
          value.delay = 0;
          value.perform();
        };
      };
    }

    game.note.logic();

  }, 1000 / game.tick)
};

game.startup = function () {
  var data = game.storage.get();

  if (data != null && data != "undefined") {
    data = JSON.parse(data);

    for (i in data) {
      if (game.data[i] != data[i])
        {
          const type=typeof game.data[i];
          if (type == "function" || type == "object" || type == "bigint" || type == "undefined") continue;
          game.data[i] = data[i];
        };
    };
    for (i in data.products) if (game.data.products[i].amount != data.products[i].amount) game.data.products[i].amount = data.products[i].amount;
    for (i in data.achievements) if (game.data.achievements[i].earned != data.achievements[i].earned) game.data.achievements[i].earned = data.achievements[i].earned;
  };

  document.querySelector("#logs").innerHTML=game.logs.data;

  // Source - https://stackoverflow.com/a/34348306
  // Posted by RegarBoy, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-08-25, License - CC BY-SA 4.0
  // modified by Yuna2077 (2026.08.25)
  document.onmousemove = function(e) {
    game.mouse.X = e.clientX;
    game.mouse.Y = e.clientY;
  };
  document.onclick = function() {
    var d = document.createElement("div");
    d.className = "clickEffect";
    d.style.top = game.mouse.Y + "px";
    d.style.left = game.mouse.X + "px";
    document.body.appendChild(d);
	  d.addEventListener('animationend',function() {
    d.parentElement.removeChild(d);
    }.bind(this));
  };

  var b = "";
  var bc = 0;
  do {
    b += chooseArray([ "+", "-" ]) + " "
    bc++;
  } while (bc < 10_000);
  document.querySelector("#background").innerHTML = b;

  game.loop();
  game.loaded = true;
};

/*  • • • • • • • • • • • • • • • •
    ╔═══════════════════════════════════════════════════════════════════════════════╗
    ║ ██╗   ██╗██╗   ██╗███╗   ██╗ █████╗       ██████╗ ██████╗ ██████╗ ███████╗
    ║ ╚██╗ ██╔╝██║   ██║████╗  ██║██╔══██╗     ██╔════╝██╔═══██╗██╔══██╗██╔════╝
    ║  ╚████╔╝ ██║   ██║██╔██╗ ██║███████║     ██║     ██║   ██║██║  ██║█████╗
    ║   ╚██╔╝  ██║   ██║██║╚██╗██║██╔══██║     ██║     ██║   ██║██║  ██║██╔══╝
    ║    ██║   ╚██████╔╝██║ ╚████║██║  ██║     ╚██████╗╚██████╔╝██████╔╝███████╗
    ║    ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝      ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
    ╚═══════════════════════════════════════════════════════════════════════════════╝
 • • • • • • • • • • • • • • • • */