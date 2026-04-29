// ✅ Map of filenames to custom replacements
const glbRedirects = {
  '0abe2f6dc5fd42886656add09d385342.glb': 'https://kirkamiddlemenscripts.github.io/Main/0abe2f6dc5fd42886656add09d385342.glb',
  '0f0dde5522f5310e5c79dc1590a6815f.glb': 'https://kirkamiddlemenscripts.github.io/Main/0f0dde5522f5310e5c79dc1590a6815f.glb',
  '72ff033c69c7ac43d6252b8bb14e8d5e.glb': 'https://kirkamiddlemenscripts.github.io/Main/72ff033c69c7ac43d6252b8bb14e8d5e.glb',
  'a00e8c95e8e6a554ba7722386fed9513.glb': 'https://kirkamiddlemenscripts.github.io/Main/a00e8c95e8e6a554ba7722386fed9513.glb',
  'e54104dfacc75e07f3d120123fe527a3.glb': 'https://kirkamiddlemenscripts.github.io/Main/e54104dfacc75e07f3d120123fe527a3.glb',
  'f625b5fedc1481a49d36748e7b19b943.glb': 'https://kirkamiddlemenscripts.github.io/Main/f625b5fedc1481a49d36748e7b19b943.glb',
  'f5575cfe08a74b6d747a0cef44d3629b.glb': 'https://kirkamiddlemenscripts.github.io/Main/f5575cfe08a74b6d747a0cef44d3629b.glb',
  'fe77594ae4a78d6d85e28f834d0ff6f4.glb': 'https://kirkamiddlemenscripts.github.io/Main/fe77594ae4a78d6d85e28f834d0ff6f4.glb',
};

// Patch fetch
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  if (args[0] && typeof args[0] === 'string') {
    for (const [original, replacement] of Object.entries(glbRedirects)) {
      if (args[0].includes(original)) {
        console.log(`🔁 Intercepted fetch: ${original} → ${replacement}`);
        args[0] = replacement;
        break;
      }
    }
  }
  return originalFetch.apply(this, args);
};

// Patch XMLHttpRequest
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
  if (typeof url === 'string') {
    for (const [original, replacement] of Object.entries(glbRedirects)) {
      if (url.includes(original)) {
        console.log(`🔁 Intercepted XHR: ${original} → ${replacement}`);
        arguments[1] = replacement;
        break;
      }
    }
  }
  return originalOpen.apply(this, arguments);
};
