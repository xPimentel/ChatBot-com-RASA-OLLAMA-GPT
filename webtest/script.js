// Configuração de partículas para o fundo
window.onload = function () {
  // Inicializa as partículas no fundo
  window.particlesJS("particles", {
    particles: {
      number: {
        value: 30,
        density: {
          enable: true,
          value_area: 800
        }
      },
      color: {
        value: "#6366f1"
      },
      shape: {
        type: "circle",
        stroke: {
          width: 0,
          color: "#000000"
        }
      },
      opacity: {
        value: 0.3,
        random: true,
        anim: {
          enable: false,
          speed: 1,
          opacity_min: 0.1,
          sync: false
        }
      },
      size: {
        value: 5,
        random: true,
        anim: {
          enable: false,
          speed: 40,
          size_min: 0.1,
          sync: false
        }
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#6366f1",
        opacity: 0.2,
        width: 1
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200
        }
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab"
        },
        onclick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 140,
          line_linked: {
            opacity: 0.5
          }
        },
        push: {
          particles_nb: 3
        }
      }
    },
    retina_detect: true
  });
};

// Elementos DOM
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");
const typingIndicator = document.getElementById("typing-indicator");
const clearButton = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");
const infoButton = document.getElementById("info-btn");
const infoModal = document.getElementById("info-modal");
const closeModal = document.getElementById("close-modal");
const voiceButton = document.getElementById("voice-btn");

// URL do backend Rasa
const RASA_SERVER_URL = "http://localhost:5005/webhooks/rest/webhook";

// Verificar preferência de tema do usuário
let darkTheme = localStorage.getItem("darkTheme") === "true";
if (darkTheme) {
  document.body.setAttribute("data-theme", "dark");
  themeToggle.classList.add("active");
}

// Auto-redimensionar o textarea conforme o usuário digita
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";

  // Limitar altura máxima
  if (this.scrollHeight > 120) {
    this.style.height = "120px";
    this.style.overflowY = "auto";
  } else {
    this.style.overflowY = "hidden";
  }
});

// Função para enviar mensagem quando o botão for clicado
sendButton.addEventListener("click", sendMessage);

// Função para enviar mensagem quando Enter for pressionado (sem shift)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Alternar tema claro/escuro
themeToggle.addEventListener("click", function () {
  darkTheme = !darkTheme;

  // Salvar preferência no localStorage
  localStorage.setItem("darkTheme", darkTheme);

  // Atualizar atributo no body para mudar o tema
  if (darkTheme) {
    document.body.setAttribute("data-theme", "dark");
    themeToggle.classList.add("active");
  } else {
    document.body.removeAttribute("data-theme");
    themeToggle.classList.remove("active");
  }
});

// Abrir modal de informações
infoButton.addEventListener("click", function () {
  infoModal.classList.add("show");
});

// Fechar modal de informações
closeModal.addEventListener("click", function () {
  infoModal.classList.remove("show");
});

// Fechar modal ao clicar fora dele
window.addEventListener("click", function (e) {
  if (e.target === infoModal) {
    infoModal.classList.remove("show");
  }
});

// Limpar histórico de conversa
clearButton.addEventListener("click", function () {
  // Manter apenas a mensagem de boas-vindas
  chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                <p>Olá! Sou o AssistenteIA. Como posso ajudar você hoje? 😊</p>
                <span class="message-time">Agora</span>
            </div>
        </div>
        <div class="message bot-message">
            <div class="message-content">
                <p>
                    Você pode me perguntar qualquer coisa usando:<br />
                    • "<strong>gpt:</strong> sua pergunta" para usar o ChatGPT<br />
                    • "<strong>ollama:</strong> sua pergunta" para usar a IA local
                </p>
                <span class="message-time">Agora</span>
            </div>
        </div>
    `;
});

// Função para formatar a hora atual
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Função para adicionar mensagem do usuário ao chat
function addUserMessage(text) {
  const messageElement = document.createElement("div");
  messageElement.className = "message user-message";
  messageElement.innerHTML = `
        <div class="message-content">
            <p>${text}</p>
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Função para adicionar mensagem do bot ao chat
function addBotMessage(text) {
  // Mostrar indicador de digitação
  typingIndicator.classList.remove("hidden");
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Simular tempo de resposta (entre 1 e 2 segundos)
  const replyTime = Math.random() * 1000 + 1000;

  setTimeout(() => {
    // Esconder indicador de digitação
    typingIndicator.classList.add("hidden");

    // Adicionar mensagem do bot
    const messageElement = document.createElement("div");
    messageElement.className = "message bot-message";

    // Processar formatação de código
    let formattedText = text;
    if (text.includes("```")) {
      formattedText = formatCodeBlocks(text);
    }

    messageElement.innerHTML = `
            <div class="message-content">
                <p>${formattedText}</p>
                <span class="message-time">${getCurrentTime()}</span>
            </div>
        `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, replyTime);
}

// Função para formatar blocos de código
function formatCodeBlocks(text) {
  // Dividir o texto em partes, separando os blocos de código
  const parts = text.split(/```([\s\S]*?)```/);
  let result = "";

  for (let i = 0; i < parts.length; i++) {
    // Partes pares são texto normal, ímpares são código
    if (i % 2 === 0) {
      result += parts[i];
    } else {
      // Formatar como bloco de código
      result += `<div class="code-block"><pre><code>${parts[i]}</code></pre></div>`;
    }
  }

  return result;
}

// Função para enviar mensagem ao backend Rasa
async function sendToRasa(message) {
  try {
    // Mostrar indicador de digitação
    typingIndicator.classList.remove("hidden");

    const response = await fetch(RASA_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: "user",
        message: message
      })
    });

    const data = await response.json();

    // Ocultar indicador de digitação
    typingIndicator.classList.add("hidden");

    // Processar respostas
    if (data && data.length > 0) {
      data.forEach((item) => {
        if (item.text) {
          addBotMessage(item.text);
        }
      });
    } else {
      addBotMessage(
        "Desculpe, não consegui processar sua solicitação. Pode tentar novamente?"
      );
    }
  } catch (error) {
    console.error("Erro ao se comunicar com o servidor:", error);
    addBotMessage(
      "Desculpe, ocorreu um erro de conexão. Verifique se o servidor Rasa está em execução."
    );
    typingIndicator.classList.add("hidden");
  }
}

// Função para processar o comando com base no prefixo
function processCommand(message) {
  // if (message.toLowerCase().startsWith("gpt:")) {
  //   const query = message.substring(4).trim();
  //   // Simulação de resposta do ChatGPT (em uma aplicação real, faria uma chamada à API da OpenAI)
  //   addBotMessage(
  //     `Usando ChatGPT para responder: "${query}"\n\nAqui está uma resposta simulada do ChatGPT. Em uma implementação real, este seria o resultado retornado pela API da OpenAI.`
  //   );
  // } else if (message.toLowerCase().startsWith("ollama:")) {
  //   const query = message.substring(7).trim();
  //   // Simulação de resposta do Ollama local
  //   addBotMessage(
  //     `Usando Ollama local para responder: "${query}"\n\nEsta é uma resposta simulada do Ollama. Em uma implementação real, este seria o resultado retornado pelo seu modelo local.`
  //   );
  // } else {
  //   // Enviar para o Rasa
  //   sendToRasa(message);
  // }

   sendToRasa(message);
}

// Função principal para enviar mensagem
function sendMessage() {
  const message = userInput.value.trim();

  if (message) {
    // Adicionar mensagem do usuário à interface
    addUserMessage(message);

    // Limpar campo de entrada
    userInput.value = "";
    userInput.style.height = "auto";

    // Processar a mensagem com base no prefixo
    processCommand(message);
  }
}

// Implementação básica do reconhecimento de voz
voiceButton.addEventListener("click", function () {
  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "pt-BR";

    voiceButton.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    };

    recognition.onerror = function () {
      voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
      addBotMessage("Desculpe, não consegui captar o áudio. Tente novamente.");
    };

    recognition.onend = function () {
      voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    };

    recognition.start();
  } else {
    addBotMessage("Desculpe, seu navegador não suporta reconhecimento de voz.");
  }
});
