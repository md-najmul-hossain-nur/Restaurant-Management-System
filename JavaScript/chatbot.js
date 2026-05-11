// Boro (Big, Modern) Chatbot Widget
// Place this in JavaScript/chatbot.js

document.addEventListener('DOMContentLoaded', function () {
  // Floating button
  if (!document.getElementById('chatbot-fab')) {
    const fab = document.createElement('button');
    fab.id = 'chatbot-fab';
    fab.title = 'Open Chatbot';
    fab.innerHTML = '<i class="fa fa-comments"></i>';
    document.body.appendChild(fab);
  }

  // Chatbot widget (hidden by default)
  if (!document.getElementById('chatbot-widget')) {
    const chatWidget = document.createElement('div');
    chatWidget.id = 'chatbot-widget';
    chatWidget.style.display = 'none';
    chatWidget.innerHTML = `
      <div id="chatbot-header">💬 Chatbot <span id="chatbot-close">&times;</span></div>
      <div id="chatbot-messages"></div>
      <form id="chatbot-form">
        <input type="text" id="chatbot-input" placeholder="Type your message..." autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    `;
    document.body.appendChild(chatWidget);
  }

  // Styles for both button and widget (smaller, more rounded, color-matched)
  const style = document.createElement('style');
  style.innerHTML = `
    #chatbot-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 56px;
      height: 56px;
      background: rgba(200, 169, 110, 0.85);
      color: #fff;
      border: none;
      border-radius: 50%;
      box-shadow: 0 4px 18px rgba(0,0,0,0.15);
      font-size: 2rem;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      backdrop-filter: blur(2px);
    }
    #chatbot-fab:hover {
      background: rgba(34,34,34,0.92);
    }
    #chatbot-widget {
      position: fixed;
      bottom: 96px;
      right: 28px;
      width: 320px;
      height: 400px;
      background: rgba(34,34,34,0.35);
      border-radius: 18px;
      box-shadow: 0 6px 32px 0 rgba(0,0,0,0.22);
      font-family: 'Poppins', Arial, sans-serif;
      z-index: 10000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1.5px solid rgba(200,169,110,0.35);
      animation: chatbot-pop 0.4s cubic-bezier(.68,-0.55,.27,1.55);
      backdrop-filter: blur(16px) saturate(160%);
      -webkit-backdrop-filter: blur(16px) saturate(160%);
    }
    @keyframes chatbot-pop {
      0% { transform: scale(0.7); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    #chatbot-header {
      background: linear-gradient(90deg, rgba(200,169,110,0.85) 0%, rgba(34,34,34,0.85) 100%);
      color: #fff;
      padding: 13px 18px;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      letter-spacing: 0.5px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      box-shadow: 0 2px 8px 0 rgba(0,0,0,0.04);
      backdrop-filter: blur(8px);
    }
    #chatbot-close {
      cursor: pointer;
      font-size: 1.4rem;
      font-weight: 400;
      transition: color 0.2s;
    }
    #chatbot-close:hover {
      color: #c8a96e;
    }
    #chatbot-messages {
      flex: 1;
      padding: 14px 10px 6px 10px;
      max-height: 260px;
      overflow-y: auto;
      font-size: 1rem;
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chatbot-msg {
      max-width: 80%;
      padding: 9px 13px;
      border-radius: 13px;
      margin-bottom: 2px;
      word-break: break-word;
      font-size: 1rem;
      line-height: 1.5;
      background: rgba(255,255,255,0.18);
      color: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      backdrop-filter: blur(4px);
    }
    .chatbot-msg.user {
      align-self: flex-end;
      background: rgba(200,169,110,0.85);
      color: #fff;
      border-bottom-right-radius: 4px;
      border: 1.5px solid rgba(200,169,110,0.25);
    }
    .chatbot-msg.bot {
      align-self: flex-start;
      background: rgba(255,255,255,0.13);
      color: #fff;
      border-bottom-left-radius: 4px;
      border: 1.5px solid rgba(255,255,255,0.10);
    }
    #chatbot-form {
      display: flex;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: transparent;
      padding: 8px 10px;
      gap: 6px;
      backdrop-filter: blur(8px);
    }
    #chatbot-input {
      flex: 1;
      border: none;
      border-radius: 7px;
      padding: 8px 10px;
      font-size: 1rem;
      outline: none;
      background: rgba(255,255,255,0.18);
      color: #fff;
      transition: box-shadow 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    #chatbot-input:focus {
      background: rgba(255,255,255,0.28);
      color: #222;
    }
    #chatbot-form button {
      background: rgba(200,169,110,0.85);
      color: #fff;
      border: none;
      padding: 0 16px;
      cursor: pointer;
      font-size: 1rem;
      border-radius: 7px;
      font-weight: 600;
      transition: background 0.2s;
      height: 34px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    #chatbot-form button:hover {
      background: #222;
    }
  `;
  document.head.appendChild(style);

  // Chatbot logic
  const messages = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const closeBtn = document.getElementById('chatbot-close');
  const widget = document.getElementById('chatbot-widget');
  const fab = document.getElementById('chatbot-fab');

  function addMessage(text, from = 'user') {
    const msg = document.createElement('div');
    msg.className = 'chatbot-msg ' + from;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function botReply(userText) {
    let reply = "I'm your Feliciano assistant! How can I help you?";
    if (/hello|hi|hey|hola|bonjour/i.test(userText)) reply = "Hello! How can I assist you today?";
    else if (/menu/i.test(userText)) reply = "You can view our menu by clicking the 'Menu' link above.";
    else if (/order/i.test(userText)) reply = "To place an order, please log in or sign up first.";
    else if (/contact/i.test(userText)) reply = "You can contact us via the 'Contact' page.";
    else if (/admin|dashboard/i.test(userText)) reply = "This is the admin dashboard. Manage employees, tables, and menu here.";
    setTimeout(() => addMessage(reply, 'bot'), 600);
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    botReply(text);
  };

  closeBtn.onclick = function () {
    widget.style.display = 'none';
  };

  fab.onclick = function () {
    widget.style.display = 'flex';
  };
});
