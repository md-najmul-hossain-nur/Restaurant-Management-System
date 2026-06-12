document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chatbot-widget')) return;

  const quickReplies = [
    'Show menu',
    'Reserve table',
    'Opening hours',
    'Contact'
  ];

  const fab = document.createElement('button');
  fab.id = 'chatbot-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Open Feliciano chat assistant');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = `
    <span class="chatbot-fab__pulse" aria-hidden="true"></span>
    <i class="fa fa-comments" aria-hidden="true"></i>
  `;
  document.body.appendChild(fab);

  const chatWidget = document.createElement('section');
  chatWidget.id = 'chatbot-widget';
  chatWidget.setAttribute('aria-label', 'Feliciano chat assistant');
  chatWidget.setAttribute('aria-hidden', 'true');
  chatWidget.innerHTML = `
    <header id="chatbot-header">
      <div class="chatbot-agent">
        <span class="chatbot-avatar" aria-hidden="true">
          <i class="fa fa-concierge-bell"></i>
        </span>
        <span>
          <strong>Feliciano Assistant</strong>
          <small><span class="chatbot-status-dot"></span> Online now</small>
        </span>
      </div>
      <div class="chatbot-actions">
        <button type="button" id="chatbot-clear" aria-label="Clear visible chat" title="Clear chat">
          <i class="fa fa-rotate-left" aria-hidden="true"></i>
        </button>
        <button type="button" id="chatbot-close" aria-label="Close chat" title="Close chat">
          <i class="fa fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    </header>

    <div class="chatbot-intro">
      <span>Need help choosing food, booking a table, or finding contact info?</span>
    </div>

    <div id="chatbot-messages" aria-live="polite" aria-relevant="additions"></div>

    <div class="chatbot-quick-replies" aria-label="Quick chat options">
      ${quickReplies.map(text => `<button type="button" data-chatbot-quick="${text}">${text}</button>`).join('')}
    </div>

    <form id="chatbot-form">
      <label class="sr-only" for="chatbot-input">Message</label>
      <input type="text" id="chatbot-input" placeholder="Type your question..." autocomplete="off" />
      <button type="submit" aria-label="Send message">
        <i class="fa fa-paper-plane" aria-hidden="true"></i>
      </button>
    </form>
  `;
  document.body.appendChild(chatWidget);

  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    #chatbot-widget,
    #chatbot-widget * {
      box-sizing: border-box;
    }

    #chatbot-widget {
      position: fixed;
      right: 28px;
      bottom: 108px;
      width: min(380px, calc(100vw - 32px));
      height: min(580px, calc(100svh - 132px));
      min-height: 440px;
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      color: #f9f7f2;
      font-family: 'Poppins', Arial, sans-serif;
      background:
        linear-gradient(145deg, rgba(30, 28, 24, 0.96), rgba(13, 13, 12, 0.98)),
        url('../Images/index.jpg') center/cover;
      background-blend-mode: multiply;
      border: 1px solid rgba(200, 169, 110, 0.34);
      border-radius: 8px;
      box-shadow: 0 22px 60px rgba(0, 0, 0, 0.42);
      transform-origin: bottom right;
      animation: chatbot-pop 220ms ease-out;
    }

    #chatbot-widget.is-open {
      display: flex;
    }

    @keyframes chatbot-pop {
      from { transform: translateY(18px) scale(0.97); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    #chatbot-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px;
      background: rgba(7, 7, 7, 0.62);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(14px);
    }

    .chatbot-agent {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 12px;
    }

    .chatbot-avatar {
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      display: grid;
      place-items: center;
      color: #1e1b16;
      background: #c8a96e;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(200, 169, 110, 0.16);
    }

    .chatbot-agent strong,
    .chatbot-agent small {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chatbot-agent strong {
      font-size: 0.98rem;
      letter-spacing: 0;
      color: #ffffff;
    }

    .chatbot-agent small {
      margin-top: 2px;
      color: rgba(255, 255, 255, 0.68);
      font-size: 0.76rem;
      font-weight: 500;
    }

    .chatbot-status-dot {
      width: 7px;
      height: 7px;
      display: inline-block;
      margin-right: 6px;
      border-radius: 50%;
      background: #66d48f;
      box-shadow: 0 0 0 4px rgba(102, 212, 143, 0.14);
      vertical-align: 1px;
    }

    .chatbot-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }

    .chatbot-actions button {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.82);
      background: rgba(255, 255, 255, 0.07);
      cursor: pointer;
      transition: background 180ms ease, color 180ms ease, transform 180ms ease;
    }

    .chatbot-actions button:hover {
      color: #ffffff;
      background: rgba(200, 169, 110, 0.24);
      transform: translateY(-1px);
    }

    .chatbot-intro {
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.76);
      background: rgba(200, 169, 110, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 0.84rem;
      line-height: 1.5;
    }

    #chatbot-messages {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(200, 169, 110, 0.5) transparent;
    }

    #chatbot-messages::-webkit-scrollbar {
      width: 8px;
    }

    #chatbot-messages::-webkit-scrollbar-thumb {
      background: rgba(200, 169, 110, 0.45);
      border-radius: 999px;
    }

    .chatbot-msg {
      width: fit-content;
      max-width: 84%;
      padding: 11px 13px;
      border-radius: 8px;
      font-size: 0.92rem;
      line-height: 1.55;
      overflow-wrap: anywhere;
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
    }

    .chatbot-msg.user {
      align-self: flex-end;
      color: #191713;
      background: #c8a96e;
      border-bottom-right-radius: 2px;
    }

    .chatbot-msg.bot {
      align-self: flex-start;
      color: rgba(255, 255, 255, 0.94);
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom-left-radius: 2px;
    }

    .chatbot-meta {
      margin-top: 5px;
      font-size: 0.7rem;
      color: currentColor;
      opacity: 0.58;
    }

    .typing {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
      padding: 10px 12px;
      color: rgba(255, 255, 255, 0.78);
      background: rgba(255, 255, 255, 0.11);
      border-radius: 8px;
      font-size: 0.88rem;
    }

    .typing span {
      width: 5px;
      height: 5px;
      display: inline-block;
      border-radius: 50%;
      background: currentColor;
      animation: chatbot-typing 1s infinite ease-in-out;
    }

    .typing span:nth-child(2) { animation-delay: 120ms; }
    .typing span:nth-child(3) { animation-delay: 240ms; }

    @keyframes chatbot-typing {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
      40% { transform: translateY(-4px); opacity: 1; }
    }

    .chatbot-quick-replies {
      display: flex;
      gap: 8px;
      padding: 0 16px 12px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .chatbot-quick-replies::-webkit-scrollbar {
      display: none;
    }

    .chatbot-quick-replies button {
      flex: 0 0 auto;
      min-height: 34px;
      padding: 8px 12px;
      color: rgba(255, 255, 255, 0.84);
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      font: 600 0.78rem 'Poppins', Arial, sans-serif;
      cursor: pointer;
      transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
      white-space: nowrap;
    }

    .chatbot-quick-replies button:hover {
      color: #191713;
      background: #c8a96e;
      border-color: #c8a96e;
    }

    #chatbot-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 44px;
      gap: 10px;
      padding: 14px 16px 16px;
      background: rgba(7, 7, 7, 0.74);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    #chatbot-input {
      width: 100%;
      height: 44px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 0 13px;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      font: 500 0.9rem 'Poppins', Arial, sans-serif;
      outline: none;
      transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }

    #chatbot-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    #chatbot-input:focus {
      border-color: rgba(200, 169, 110, 0.8);
      background: rgba(255, 255, 255, 0.14);
      box-shadow: 0 0 0 4px rgba(200, 169, 110, 0.13);
    }

    #chatbot-form button {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: none;
      border-radius: 8px;
      color: #1b1814;
      background: #c8a96e;
      cursor: pointer;
      transition: filter 180ms ease, transform 180ms ease;
    }

    #chatbot-form button:hover {
      filter: brightness(1.05);
      transform: translateY(-1px);
    }

    #chatbot-fab {
      position: fixed;
      right: 28px;
      bottom: 28px;
      width: 62px;
      height: 62px;
      z-index: 10001;
      display: grid;
      place-items: center;
      border: none;
      border-radius: 50%;
      color: #1b1814;
      background: #c8a96e;
      box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28), 0 0 0 8px rgba(200, 169, 110, 0.14);
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
    }

    #chatbot-fab i {
      position: relative;
      z-index: 2;
      font-size: 1.35rem;
    }

    #chatbot-fab:hover {
      transform: translateY(-3px);
      background: #d6b979;
      box-shadow: 0 20px 42px rgba(0, 0, 0, 0.34), 0 0 0 10px rgba(200, 169, 110, 0.16);
    }

    .chatbot-fab__pulse {
      position: absolute;
      inset: -7px;
      border: 1px solid rgba(200, 169, 110, 0.48);
      border-radius: 50%;
      animation: chatbot-pulse 1.9s infinite ease-out;
    }

    @keyframes chatbot-pulse {
      0% { transform: scale(0.78); opacity: 0.65; }
      100% { transform: scale(1.25); opacity: 0; }
    }

    @media (max-width: 560px) {
      #chatbot-widget {
        right: 12px;
        left: 12px;
        bottom: 88px;
        width: auto;
        height: min(620px, calc(100svh - 104px));
        min-height: 380px;
      }

      #chatbot-fab {
        right: 18px;
        bottom: 18px;
        width: 56px;
        height: 56px;
      }

      .chatbot-msg {
        max-width: 90%;
      }
    }
  `;
  document.head.appendChild(style);

  const messagesContainer = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const closeBtn = document.getElementById('chatbot-close');
  const clearBtn = document.getElementById('chatbot-clear');
  const widget = document.getElementById('chatbot-widget');
  const fabBtn = document.getElementById('chatbot-fab');

  let isTyping = false;
  let chatPollTimer = null;
  let hasLoadedHistory = false;

  function isOpen() {
    return widget.classList.contains('is-open');
  }

  function openChat() {
    widget.classList.add('is-open');
    widget.setAttribute('aria-hidden', 'false');
    fabBtn.setAttribute('aria-expanded', 'true');
    input.focus();
    loadChatHistory().then(() => {
      startChatPolling();
      if (!messagesContainer.children.length) {
        addMessage('Hi, welcome to Feliciano. I can help with menu, table booking, opening hours, or contact details.', 'bot');
      }
    });
  }

  function closeChat() {
    widget.classList.remove('is-open');
    widget.setAttribute('aria-hidden', 'true');
    fabBtn.setAttribute('aria-expanded', 'false');
    stopChatPolling();
    fabBtn.focus();
  }

  function addMessage(text, from, meta = '') {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg ${from}`;
    msg.textContent = text;

    if (meta) {
      const metaEl = document.createElement('div');
      metaEl.className = 'chatbot-meta';
      metaEl.textContent = meta;
      msg.appendChild(metaEl);
    }

    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function loadChatHistory() {
    try {
      const res = await fetch('../api/get_chat_history.php', { credentials: 'same-origin' });
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success || !Array.isArray(data.messages)) return;

      const currentCount = messagesContainer.querySelectorAll('.chatbot-msg').length;
      if (hasLoadedHistory && currentCount === data.messages.length) return;

      messagesContainer.innerHTML = '';
      data.messages.forEach(msg => {
        addMessage(msg.message, msg.source === 'user' ? 'user' : 'bot');
      });
      hasLoadedHistory = true;
    } catch (err) {
      console.warn('Could not load chat history', err);
    }
  }

  function startChatPolling() {
    if (chatPollTimer) return;
    chatPollTimer = setInterval(() => {
      if (isOpen() && !isTyping) loadChatHistory();
    }, 4000);
  }

  function stopChatPolling() {
    if (!chatPollTimer) return;
    clearInterval(chatPollTimer);
    chatPollTimer = null;
  }

  function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;

    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.id = 'typing-indicator';
    typing.setAttribute('aria-label', 'Feliciano assistant is typing');
    typing.innerHTML = '<span></span><span></span><span></span>';

    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
    isTyping = false;
  }

  function getBotReply(userText) {
    const text = userText.toLowerCase();

    if (/hello|hi|hey|assalam|salam|sup/.test(text)) {
      return 'Hello, welcome to Feliciano. How can I help you today?';
    }

    if (/menu|food|dish|item|price|special|specialty|show menu/.test(text)) {
      return 'Our menu page has the full dish list. Tap Menu in the navigation, or ask me about ordering and I will guide you.';
    }

    if (/order|checkout|buy|cart/.test(text)) {
      return 'To place an order, open the Menu page, choose a dish, and continue from Order now. Login may be required before checkout.';
    }

    if (/reserve|reservation|book|table|seat/.test(text)) {
      return 'For table booking, please login or sign up first. After that you can choose an available table and submit a reservation.';
    }

    if (/hour|open|close|time|schedule/.test(text)) {
      return 'Feliciano is open Monday to Thursday from 9:00 to 24:00, and Friday to Sunday from 9:00 to 02:00.';
    }

    if (/contact|phone|location|address|email|map/.test(text)) {
      return 'You can find phone, address, and location details on the Contact page. The homepage phone number is +1-978-123-4567.';
    }

    if (/login|sign in|signup|register|account/.test(text)) {
      return 'Use the profile icon in the top navigation to login or create an account.';
    }

    if (/admin|dashboard|staff|employee|chef|waiter/.test(text)) {
      return 'Staff dashboards are available after login with the correct role. Admins manage employees, menu items, tables, and reports.';
    }

    if (/thank|thanks|shukriya/.test(text)) {
      return 'You are welcome. I am here if you need anything else.';
    }

    if (/bye|goodbye|see you/.test(text)) {
      return 'Goodbye. Hope to see you at Feliciano soon.';
    }

    return 'I can help with menu, ordering, reservations, opening hours, contact details, or login guidance. What would you like to do?';
  }

  async function sendToServer(message, source = 'user') {
    try {
      await fetch('../api/save_chat.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, source })
      });
    } catch (err) {
      console.warn('Chat save failed', err);
    }
  }

  async function submitMessage(text) {
    const cleanText = text.trim();
    if (!cleanText || isTyping) return;

    input.value = '';
    addMessage(cleanText, 'user');
    await sendToServer(cleanText, 'user');

    showTypingIndicator();
    window.setTimeout(async () => {
      const reply = getBotReply(cleanText);
      removeTypingIndicator();
      addMessage(reply, 'bot');
      await sendToServer(reply, 'bot');
      hasLoadedHistory = false;
    }, 650);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    submitMessage(input.value);
  });

  document.querySelectorAll('[data-chatbot-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      submitMessage(btn.dataset.chatbotQuick || btn.textContent || '');
    });
  });

  fabBtn.addEventListener('click', () => {
    if (isOpen()) closeChat();
    else openChat();
  });

  closeBtn.addEventListener('click', closeChat);

  clearBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    hasLoadedHistory = true;
    addMessage('Visible chat cleared. Your saved session history may return after refresh.', 'bot');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) {
      closeChat();
      return;
    }

    const activeTag = document.activeElement?.tagName;
    if (e.key === '/' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && !isOpen()) {
      e.preventDefault();
      openChat();
    }
  });

  window.addEventListener('focus', () => {
    if (isOpen() && !isTyping) loadChatHistory();
  });
});
