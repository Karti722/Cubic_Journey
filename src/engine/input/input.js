export function createInput(targetElement, onDrag, bindings = {}) {
  const keys = {};
  const actionLatch = {};

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function handleKeyDown(event) {
    keys[event.code] = true;
    if (event.code.startsWith("Arrow") || isBoundToAction(event.code, bindings)) event.preventDefault();
  }

  function handleKeyUp(event) {
    keys[event.code] = false;
  }

  function handleMouseDown(event) {
    isDragging = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleMouseMove(event) {
    if (!isDragging) return;

    const dx = event.clientX - lastMouseX;
    const dy = event.clientY - lastMouseY;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    onDrag(dx, dy);
  }

  addEventListener("keydown", handleKeyDown);
  addEventListener("keyup", handleKeyUp);
  addEventListener("mouseup", handleMouseUp);
  addEventListener("mousemove", handleMouseMove);
  targetElement.addEventListener("mousedown", handleMouseDown);

  return {
    keys,
    bindings,
    isActionDown(action) {
      const codes = bindings[action] || [];
      return codes.some(code => Boolean(keys[code]));
    },
    isActionPressed(action) {
      const pressed = this.isActionDown(action);
      if (pressed) {
        if (actionLatch[action]) return false;
        actionLatch[action] = true;
        return true;
      }

      actionLatch[action] = false;
      return false;
    },
    rebindAction(action, code) {
      bindings[action] = [code];
    },
    clearAction(action) {
      bindings[action] = [];
    }
  };
}

function isBoundToAction(code, bindings) {
  return Object.values(bindings).some(codes => Array.isArray(codes) && codes.includes(code));
}
