document.addEventListener('DOMContentLoaded', function () {
  // Prevent duplicate initialization
  if (document.getElementById('chatbot-fab')) return;

  // ==================== CREATE ELEMENTS ====================
  const fab = document.createElement('button');
  fab.id = 'chatbot-fab';
  fab.title = 'Chat with Feliciano Assistant';
  fab.innerHTML = '<i class="fa fa-comments"></i>';
  document.body.appendChild(fab);

  const chatWidget = document.createElement('div');
  chatWidget.id = 'chatbot-widget';
  chatWidget.style.display = 'none';
  chatWidget.innerHTML = `
    <div id="chatbot-header">
      <div>
        <strong>Feliciano Assistant</strong>
        <small>Online</small>
      </div>
      <div style="display:flex; gap:8px;">
        <span id="chatbot-clear" title="Clear chat">🗑</span>
        <span id="chatbot-close" title="Close">&times;</span>
      </div>
    </div>
    <div id="chatbot-messages"></div>
    <form id="chatbot-form">
      <input type="text" id="chatbot-input" placeholder="Ask anything..." autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  `;
  document.body.appendChild(chatWidget);

  // ==================== STYLES ====================
  const style = document.createElement('style');
  style.innerHTML = `
    #chatbot-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 62px;
      height: 62px;
      background: linear-gradient(135deg, #c8a96e, #a67c52);
      color: #fff;
      border: none;
      border-radius: 50%;
      box-shadow: 0 6px 20px rgba(200, 169, 110, 0.4);
      font-size: 1.9rem;
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    #chatbot-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 25px rgba(200, 169, 110, 0.5);
    }

    #chatbot-widget {
      position: fixed;
      bottom: 110px;
      right: 28px;
      width: 340px;
      height: 480px;
      background: rgba(34, 34, 34, 0.95);
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      font-family: 'Poppins', Arial, sans-serif;
      z-index: 10000;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(200,169,110,0.4);
      animation: chatbot-pop 0.4s cubic-bezier(0.34,1.56,0.64,1);
      backdrop-filter: blur(20px);
    }

    @keyframes chatbot-pop {
      from { transform: scale(0.6) translateY(30px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    #chatbot-header {
      background: linear-gradient(90deg, #c8a96e, #2a2a2a);
      color: white;
      padding: 14px 18px;
      font-size: 1.15rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    #chatbot-header small {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    #chatbot-close, #chatbot-clear {
      cursor: pointer;
      font-size: 1.5rem;
      padding: 0 6px;
      transition: color 0.2s;
    }
    #chatbot-close:hover { color: #ff6b6b; }
    #chatbot-clear:hover { color: #c8a96e; }

    #chatbot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: transparent;
      scrollbar-width: thin;
    }

    .chatbot-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      line-height: 1.45;
      font-size: 0.98rem;
      word-break: break-word;
    }

    .chatbot-msg.user {
      align-self: flex-end;
      background: #c8a96e;
      color: #1a1a1a;
      border-bottom-right-radius: 4px;
    }

    .chatbot-msg.bot {
      align-self: flex-start;
      background: rgba(255,255,255,0.12);
      color: #fff;
      border-bottom-left-radius: 4px;
    }

    .typing {
      align-self: flex-start;
      padding: 10px 14px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
    }

    #chatbot-form {
      padding: 10px;
      background: rgba(0,0,0,0.2);
      display: flex;
      gap: 8px;
    }

    #chatbot-input {
      flex: 1;
      border: none;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 1rem;
      background: rgba(255,255,255,0.15);
      color: white;
    }

    #chatbot-input:focus {
      outline: none;
      background: rgba(255,255,255,0.25);
    }

    #chatbot-form button {
      background: #c8a96e;
      color: #1a1a1a;
      border: none;
      padding: 0 20px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // ==================== CHAT LOGIC ====================
  const messagesContainer = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const closeBtn = document.getElementById('chatbot-close');
  const clearBtn = document.getElementById('chatbot-clear');
  const widget = document.getElementById('chatbot-widget');
  const fabBtn = document.getElementById('chatbot-fab');

  let isTyping = false;

  function addMessage(text, from) {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg ${from}`;
    msg.textContent = text;
    messagesContainer.appendChild(msg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    const typing = document.createElement('div');
    typing.className = 'typing';
    typing.id = 'typing-indicator';
    typing.innerHTML = 'Feliciano is typing<span style="animation: dots 1.4s steps(4,end) infinite;">...</span>';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
    isTyping = false;
  }

  function botReply(userText) {
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();

      let reply = "I'm here to help! What would you like to know?";

      const text = userText.toLowerCase();

      if (/hello|hi|hey|assalam|sup/i.test(text)) 
        reply = "Hello! Welcome to Feliciano 👋 How can I assist you today?";
      
      else if (/menu|food|dish/i.test(text)) 
        reply = "You can view our full menu by clicking the **Menu** link in the navigation bar.";
      
      else if (/order|book|reserve|table/i.test(text)) 
        reply = "To place an order or reserve a table, please log in or sign up first.";
      
      else if (/contact|phone|location|address/i.test(text)) 
        reply = "You can find our contact details and location on the **Contact** page.";
      
      else if (/admin|dashboard|staff|employee/i.test(text)) 
        reply = "This is the admin dashboard. You can manage employees, tables, and the menu here.";
      
      else if (/thank|thanks|shukriya/i.test(text)) 
        reply = "You're most welcome! 😊";
      
      else if (/bye|goodbye|see you/i.test(text)) 
        reply = "Goodbye! Have a great day! 👋";

      addMessage(reply, 'bot');
    }, 800);
  }

  // Send message
  form.onsubmit = function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isTyping) return;

    addMessage(text, 'user');
    input.value = '';
    botReply(text);
  };

  // Open / Close
  fabBtn.onclick = () => {
    widget.style.display = 'flex';
    input.focus();
    
    // Show welcome message only once
    if (messagesContainer.children.length === 0) {
      setTimeout(() => {
        addMessage("Hi there! I'm Feliciano's AI assistant. How can I help you today?", 'bot');
      }, 400);
    }
  };

  closeBtn.onclick = () => widget.style.display = 'none';

  // Clear chat
  clearBtn.onclick = () => {
    if (confirm("Clear chat history?")) {
      messagesContainer.innerHTML = '';
    }
  };

  // Keyboard support
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
      widget.style.display = 'flex';
      input.focus();
    }
  });
});