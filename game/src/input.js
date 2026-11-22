// Keyboard input: held-key state plus one-shot action callbacks.

export function createInput(onAction) {
  const held = {
    left: false, right: false, up: false, down: false, sneak: false,
  };
  const map = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };
  const actions = {
    KeyQ: 'coin', KeyF: 'smoke', KeyR: 'restart', KeyM: 'mute',
    KeyP: 'pause', Escape: 'pause', Enter: 'confirm', Space: 'confirm',
  };
  window.addEventListener('keydown', (e) => {
    if (map[e.code]) { held[map[e.code]] = true; e.preventDefault(); }
    if (actions[e.code] && !e.repeat) { onAction(actions[e.code]); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (map[e.code]) { held[map[e.code]] = false; e.preventDefault(); }
  });
  window.addEventListener('blur', () => {
    held.left = held.right = held.up = held.down = held.sneak = false;
  });
  return held;
}
