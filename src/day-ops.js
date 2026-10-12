// day-ops.js — every change to the days of a calendar goes through here, so it can be undone.
//
// A change is { calKey, day, before, after }: the day object before and after (null = no data for
// that day). One user action (a saved day, a multiple selection, a pattern) is one entry in the
// undo history, even when it touches several days or several calendars. The history lasts until
// the app is closed.

const DayOps = (() => {
  const MAX = 100;
  const undoStack = [];
  const redoStack = [];
  let _busy = Promise.resolve();   // changes are written one after the other

  const same = (a, b) => JSON.stringify(a || null) === JSON.stringify(b || null);

  async function write(changes, useAfter) {
    const byCal = new Map();
    for (const c of changes) {
      if (!byCal.has(c.calKey)) byCal.set(c.calKey, []);
      byCal.get(c.calKey).push(c);
    }
    for (const [key, list] of byCal) {
      const data = await Storage.load(key);
      if (!data) continue;                        // calendar deleted meanwhile
      data.days = data.days || {};
      for (const c of list) {
        const v = useAfter ? c.after : c.before;
        if (v) data.days[c.day] = v; else delete data.days[c.day];
      }
      await Storage.save(key, data);
    }
  }

  function queue(fn) {
    const run = _busy.then(fn, fn);
    _busy = run.catch(() => {});
    return run;
  }

  // Applies the changes and records them as one undoable step. Returns how many days changed.
  function apply(changes) {
    return queue(async () => {
      const real = changes.filter(c => !same(c.before, c.after));
      if (!real.length) return 0;
      await write(real, true);
      undoStack.push(real);
      if (undoStack.length > MAX) undoStack.shift();
      redoStack.length = 0;
      App.refresh();
      return real.length;
    });
  }

  function undo() {
    return queue(async () => {
      const step = undoStack.pop();
      if (!step) return false;
      await write(step, false);
      redoStack.push(step);
      App.refresh();
      return true;
    });
  }

  function redo() {
    return queue(async () => {
      const step = redoStack.pop();
      if (!step) return false;
      await write(step, true);
      undoStack.push(step);
      App.refresh();
      return true;
    });
  }

  return { apply, undo, redo, canUndo: () => undoStack.length > 0, canRedo: () => redoStack.length > 0 };
})();
