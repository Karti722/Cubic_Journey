export function createInput(targetElement, onDrag) {
  const keys = {};

  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function handleKeyDown(event) {
    keys[event.code] = true;
    if (event.code.startsWith("Arrow")) event.preventDefault();
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
    keys
  };
}
