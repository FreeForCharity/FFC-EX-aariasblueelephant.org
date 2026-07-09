// stats.js — engagement metrics for parent insights
window.MB = window.MB || {};
(function(){
  const STATS_KEY = 'mb_stats';
  const Stats = {
    data: { sessions: 0, blocksPlaced: 0, tidyUps: 0, photosTaken: 0, buildsSaved: 0 }
  };

  function load(){
    try { Stats.data = JSON.parse(localStorage.getItem(STATS_KEY)) || { sessions: 0, blocksPlaced: 0, tidyUps: 0, photosTaken: 0, buildsSaved: 0 }; }
    catch(e){ Stats.data = { sessions: 0, blocksPlaced: 0, tidyUps: 0, photosTaken: 0, buildsSaved: 0 }; }
  }

  function save(){
    try { localStorage.setItem(STATS_KEY, JSON.stringify(Stats.data)); }
    catch(e){}
  }

  Stats.bump = function(key, amount){
    load();
    if (Stats.data.hasOwnProperty(key)){
      Stats.data[key] = (Stats.data[key] || 0) + (amount || 1);
      save();
    }
  };

  Stats.get = function(key){
    load();
    return Stats.data[key] || 0;
  };

  Stats.getAll = function(){
    load();
    return Stats.data;
  };

  load();
  MB.Stats = Stats;
})();
