// script.js - front-end handler for chat form and /api/chat backend
// Expected HTML:
// <form id="chat-form">
//   <input type="text" id="user-input" />
//   <button type="submit">Send</button>
// </form>
// <div id="chat-box"></div>

(function () {
  const API_PATH = '/api/chat';
  const REQUEST_TIMEOUT_MS = 30000; // 30s timeout

  const form = document.getElementById('chat-form');
  const input = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');

  if (!form || !input || !chatBox) {
    console.error('Missing required DOM elements: #chat-form, #user-input, #chat-box');
    return;
  }

  // Helpers
  function createMessageElement(role, text, { temp = false } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${role}${temp ? ' temp' : ''}`;
    wrapper.setAttribute('data-role', role);

    const content = document.createElement('div');
    content.className = 'message-content';
    // Use textContent to avoid XSS
    content.textContent = text;
    wrapper.appendChild(content);

    return wrapper;
  }

  function replaceMessageText(messageEl, text) {
    if (!messageEl) return;
    const content = messageEl.querySelector('.message-content');
    if (content) content.textContent = text;
    messageEl.classList.remove('temp');
  }

  function appendMessage(role, text, opts = {}) {
    const el = createMessageElement(role, text, opts);
    chatBox.appendChild(el);
    scrollToBottom();
    return el;
  }

  function scrollToBottom() {
    // Smooth scroll if available; fallback to instant
    if ('scrollBehavior' in document.documentElement.style) {
      chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    } else {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  function setControlsDisabled(disabled) {
    input.disabled = disabled;
    const submitButton = form.querySelector('[type="submit"], button');
    if (submitButton) submitButton.disabled = disabled;
  }

  // Main submit handler
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const raw = input.value;
    const message = (raw || '').trim();
    if (!message) {
      input.value = '';
      input.focus();
      return;
    }

    // Add user's message to chat
    appendMessage('user', message);

    // Clear input and disable controls while waiting
    input.value = '';
    setControlsDisabled(true);
    input.blur();

    // Show temporary thinking message
    const thinkingEl = appendMessage('bot', 'Thinking...', { temp: true });

    // Prepare request with timeout/abort
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const payload = {
        messages: [
          { role: 'user', content: message }
        ]
      };

      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        // Try to parse error details if provided
        let errorText = `Failed to get response from server. (${res.status} ${res.statusText})`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.error) {
            errorText = `Failed to get response from server. ${errBody.error}`;
          }
        } catch (e) {
          // ignore JSON parse errors
        }
        replaceMessageText(thinkingEl, errorText);
        return;
      }

      const data = await res.json();

      // Expecting: { "result": "<gemini_ai_response>" }
      if (!data || typeof data.result !== 'string' || data.result.trim() === '') {
        replaceMessageText(thinkingEl, 'Sorry, no response received.');
        return;
      }

      replaceMessageText(thinkingEl, data.result.trim());
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') {
        replaceMessageText(thinkingEl, 'Request timed out. Please try again.');
      } else {
        replaceMessageText(thinkingEl, 'Failed to get response from server.');
        console.error('Chat request error:', err);
      }
    } finally {
      setControlsDisabled(false);
      input.focus();
    }
  });

  // Optional: allow pressing Enter in input to submit (already handled by form submit),
  // and Ctrl+Enter/Shift+Enter for multi-line could be implemented if input is a textarea.
})();
