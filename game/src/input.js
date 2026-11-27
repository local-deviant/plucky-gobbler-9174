// Keyboard and mouse, one shape for both: the game loop reads a fresh
// snapshot each frame, and the autopilot writes the same shape in tests.
export function createInput(canvas) {
  const keys = new Set();
  const state = { mx: 0, my: 0, sprint: false, hide: false, click: null, clickedButton: null };

  function recompute() {
    let mx = 0;
    let my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1;
    if (keys.has('arrowright') || keys.has('d')) mx += 1;
    if (keys.has('arrowup') || keys.has('w')) my -= 1;
    if (keys.has('arrowdown') || keys.has('s')) my += 1;
    state.mx = mx;
    state.my = my;
    state.sprint = keys.has('shift');
    state.hide = keys.has('h');
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    keys.add(key);
    recompute();
  }
  function onKeyUp(event) {
    keys.delete(event.key.toLowerCase());
    recompute();
  }
  function onMouse(event) {
    const rect = canvas.getBoundingClientRect();
    state.click = {
      x: ((event.clientX - rect.left) / rect.width) * 960,
      y: ((event.clientY - rect.top) / rect.height) * 600,
    };
  }
  function onBlur() {
    keys.clear();
    recompute();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouse);

  return {
    state,
    // Single keys the menus watch: Enter to start, R to restart, P pause, M mute.
    pressed(key) {
      return keys.has(key.toLowerCase());
    },
    consumeClick() {
      const click = state.click;
      state.click = null;
      return click;
    },
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('mousedown', onMouse);
    },
  };
}
