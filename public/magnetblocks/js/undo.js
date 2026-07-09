// undo.js — one-step-back-in-time ↩️: a small rolling history of table states
window.MB = window.MB || {};
(function(){
  const CAP = 10;
  const U = { stack: [] };

  // call after a committed change: place / paint / rotate / put-back
  U.push = function(){
    if (!MB.Bag || !MB.Builder) return;
    U.stack.push(MB.Bag.serializeTable());
    if (U.stack.length > CAP) U.stack.shift();
    U.onChange && U.onChange();
  };

  U.canUndo = function(){ return U.stack.length > 0; };

  // restore the table to how it looked just before the most recent change
  U.undo = function(){
    if (!U.stack.length || MB.Builder.grabbed || MB.Builder.locked) return false;
    U.stack.pop(); // discard the state that resulted from the last action
    const prev = U.stack.length ? U.stack[U.stack.length - 1] : [];
    MB.Builder.select(null);
    for (const b of [...MB.Magnet.blocks]) if (b.onTable) MB.Magnet.removeBlock(b);
    if (prev.length) MB.Bag.rebuildPieces(prev, MB.Builder.scene);
    U.onChange && U.onChange();
    return true;
  };

  MB.Undo = U;
})();
