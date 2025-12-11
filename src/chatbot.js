/**
 * 만능 멘토 챗봇 모듈
 * 페이지별로 다른 역할을 하는 챗봇을 제공하며, 각 페이지별로 독립된 대화 맥락을 유지합니다.
 */

// 페이지별 페르소나 (System Prompts)
const PERSONAS = {
  // 1페이지: 아이디어 산출 (향후 확장 가능)
  idea: {
    systemPrompt: `너는 창의적인 전자제품 발명가야. 학생의 아이디어를 실현해주는 메이커 선생님입니다.`,
    welcomeMessage: `안녕하세요! 저는 발명 선생님이에요! 🎓`,
    title: '🤖 발명 선생님'
  },
  
  // 2페이지: 창의적 발명가
  sensors: {
    systemPrompt: `너는 창의적인 전자제품 발명가야. 학생이 '어떤 동작'을 구현하고 싶다고 말하면, 그걸 실현할 수 있는 최적의 센서를 추천해줘. 

우리가 배운 10가지 센서 외에 더 전문적인 센서(예: 자이로 센서, 가스 센서, 압력 센서, 근접 센서, 적외선 거리 센서 등)를 추천해도 좋아. 

설명은 중학생이 이해하기 쉽게 해줘. 친절하고 격려하는 톤으로 대화하세요.`,
    welcomeMessage: `안녕하세요! 저는 척척박사 센서 AI예요! 🎓<br>
어떤 센서를 사용하면 좋을지 궁금한 점이 있나요?<br>
예: "손을 대지 않고 쓰레기통 문을 열고 싶어"라고 물어보세요!`,
    title: '🤖 척척박사 센서 AI'
  },
  
  // 3페이지: 아두이노 코딩 튜터 (소크라테스식)
  practice: {
    systemPrompt: `너는 아두이노 코딩을 가르치는 소크라테스식 선생님이야. 학생이 코드를 물어보면, 정답을 바로 알려주지 말고 질문을 통해 학생이 스스로 깨닫게 유도해야 해.

중요한 가이드라인:
1. 학생이 코드를 물어보면 "아두이노의 몇 번 핀에 연결했니?", "입력 장치니, 출력 장치니?" 등 회로 연결 상태부터 역으로 질문해.
2. 코드를 짤 때는 setup()(설정)과 loop()(반복)의 개념을 먼저 설명해.
3. 코드를 보여줄 때는 각 줄마다 주석(//)으로 아주 친절하게 설명을 달아줘.
4. 절대 완성된 전체 코드를 처음부터 툭 던져주지 마. 단계별로 질문하고, 학생이 답할 때마다 조금씩 힌트를 줘.
5. 학생이 막혔을 때는 "어떤 부분이 어려운지 말해봐", "에러 메시지가 뭐라고 나와?"처럼 구체적인 질문을 해.
6. 친절하고 격려하는 톤으로 대화하되, 학생이 스스로 생각하게 유도하는 것이 목표야.`,
    welcomeMessage: `안녕! 아두이노 연결은 잘 됐니? 코딩하다가 막히면 언제든 물어봐! 같이 고민해 보자. 💡`,
    title: '🤖 아두이노 코딩 튜터'
  }
};

// 챗봇 상태 관리 (페이지별로 독립적으로 관리)
let chatbotHistory = [];
let currentPersona = null;
let storageKey = null;
let messagesContainer = null;

// 최대 대화 기록 수 (5쌍 = 10개 메시지)
const MAX_HISTORY_LENGTH = 10;

/**
 * 현재 페이지에 맞는 페르소나를 감지하고 설정합니다.
 * @returns {Object} 페르소나 객체
 */
function detectPersona() {
  const pathname = window.location.pathname;
  
  if (pathname.includes('index.html')) {
    return PERSONAS.idea;
  } else if (pathname.includes('sencors.html') || pathname.includes('sensors.html')) {
    return PERSONAS.sensors;
  } else if (pathname.includes('practice.html')) {
    return PERSONAS.practice;
  }
  
  // 기본값: sensors 페르소나
  return PERSONAS.sensors;
}

/**
 * 페이지별 고유 저장소 키를 생성합니다.
 * @returns {string} sessionStorage 키
 */
function getStorageKey() {
  const pathname = window.location.pathname;
  
  if (pathname.includes('index.html')) {
    return 'chat_history_idea';
  } else if (pathname.includes('sencors.html') || pathname.includes('sensors.html')) {
    return 'chat_history_sensor';
  } else if (pathname.includes('practice.html')) {
    return 'chat_history_coding';
  }
  
  // 기본값
  return 'chat_history_default';
}

/**
 * sessionStorage에서 대화 내역을 불러옵니다.
 * @returns {Array} 대화 내역 배열
 */
function loadHistory() {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('대화 내역 불러오기 실패:', error);
  }
  return [];
}

/**
 * 대화 내역을 sessionStorage에 저장합니다.
 * 최근 10개(5쌍)만 유지하고 오래된 대화는 삭제합니다.
 */
function saveHistory() {
  try {
    // 최대 길이 제한: 오래된 메시지부터 삭제
    while (chatbotHistory.length > MAX_HISTORY_LENGTH) {
      chatbotHistory.shift();
    }
    
    sessionStorage.setItem(storageKey, JSON.stringify(chatbotHistory));
  } catch (error) {
    console.error('대화 내역 저장 실패:', error);
  }
}

/**
 * 저장된 대화 내역을 UI에 복원합니다.
 */
function renderHistory(container) {
  if (!container) return;
  
  // 기존 메시지 모두 제거 (환영 메시지 제외)
  const welcomeMessage = container.querySelector('.chatbot-message.ai-message:first-child');
  container.innerHTML = '';
  
  // 환영 메시지 다시 추가
  if (welcomeMessage) {
    container.appendChild(welcomeMessage);
  } else {
    // 환영 메시지가 없으면 새로 생성
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'chatbot-message ai-message';
    welcomeDiv.innerHTML = `
      <div class="message-bubble">
        ${currentPersona.welcomeMessage}
      </div>
    `;
    container.appendChild(welcomeDiv);
  }
  
  // 저장된 대화 내역을 UI에 복원
  chatbotHistory.forEach((msg) => {
    addMessage(container, msg.role === 'user' ? 'user' : 'ai', msg.content, false);
  });
  
  // 스크롤을 맨 아래로
  container.scrollTop = container.scrollHeight;
}

/**
 * 대화 내역을 초기화합니다.
 */
function clearHistory(container) {
  chatbotHistory = [];
  sessionStorage.removeItem(storageKey);
  
  // UI 초기화
  if (container) {
    container.innerHTML = '';
    
    // 환영 메시지 다시 추가
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'chatbot-message ai-message';
    welcomeDiv.innerHTML = `
      <div class="message-bubble">
        ${currentPersona.welcomeMessage}
      </div>
    `;
    container.appendChild(welcomeDiv);
  }
}

/**
 * 챗봇을 초기화합니다.
 * @param {Object} options - 초기화 옵션
 * @param {HTMLElement} options.messagesContainer - 메시지 컨테이너 요소
 * @param {HTMLElement} options.inputElement - 입력 필드 요소
 * @param {HTMLElement} options.sendButton - 전송 버튼 요소
 * @param {HTMLElement} options.toggleButton - 토글 버튼 요소
 * @param {HTMLElement} options.closeButton - 닫기 버튼 요소
 * @param {HTMLElement} options.windowElement - 챗봇 창 요소
 * @param {HTMLElement} options.loadingIndicator - 로딩 표시 요소
 * @param {HTMLElement} options.titleElement - 제목 요소 (선택사항)
 * @param {HTMLElement} options.clearButton - 대화 지우기 버튼 요소 (선택사항)
 */
export function initChatbot(options) {
  const {
    messagesContainer: container,
    inputElement,
    sendButton,
    toggleButton,
    closeButton,
    windowElement,
    loadingIndicator,
    titleElement,
    clearButton
  } = options;

  // 전역 변수에 저장
  messagesContainer = container;

  // 페르소나 감지 및 설정
  currentPersona = detectPersona();
  
  // 저장소 키 설정
  storageKey = getStorageKey();
  
  // 저장된 대화 내역 불러오기
  chatbotHistory = loadHistory();
  
  // 제목 업데이트 (있는 경우)
  if (titleElement) {
    titleElement.textContent = currentPersona.title;
  }
  
  // 대화 내역이 있으면 UI에 복원, 없으면 환영 메시지만 표시
  if (container) {
    if (chatbotHistory.length > 0) {
      // 저장된 대화가 있으면 복원
      renderHistory(container);
    } else {
      // 저장된 대화가 없으면 환영 메시지만 표시
      if (container.children.length === 0) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'chatbot-message ai-message';
        welcomeDiv.innerHTML = `
          <div class="message-bubble">
            ${currentPersona.welcomeMessage}
          </div>
        `;
        container.appendChild(welcomeDiv);
      }
    }
  }
  
  // 대화 지우기 버튼 이벤트
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (confirm('대화 내역을 모두 지우시겠어요?')) {
        clearHistory(container);
      }
    });
  }
  
  // 이벤트 리스너 등록
  if (toggleButton) {
    toggleButton.addEventListener('click', () => toggleChatbot(windowElement, inputElement));
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', () => toggleChatbot(windowElement, inputElement));
  }
  
  if (sendButton) {
    sendButton.addEventListener('click', () => sendMessage({
      inputElement,
      sendButton,
      messagesContainer: container,
      loadingIndicator
    }));
  }
  
  if (inputElement) {
    inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage({
          inputElement,
          sendButton,
          messagesContainer: container,
          loadingIndicator
        });
      }
    });
  }
}

/**
 * 챗봇 창을 토글합니다.
 */
function toggleChatbot(windowElement, inputElement) {
  if (!windowElement) return;
  
  windowElement.classList.toggle('hidden');
  if (!windowElement.classList.contains('hidden') && inputElement) {
    inputElement.focus();
  }
}

/**
 * 메시지를 전송하고 AI 응답을 받습니다.
 */
async function sendMessage(options) {
  const {
    inputElement,
    sendButton,
    messagesContainer: container,
    loadingIndicator
  } = options;
  
  const message = inputElement.value.trim();
  
  if (!message) return;
  
  // 사용자 메시지 추가
  addMessage(container, 'user', message);
  chatbotHistory.push({
    role: 'user',
    content: message
  });
  
  // 대화 내역 저장
  saveHistory();
  
  // 입력창 초기화 및 비활성화
  inputElement.value = '';
  inputElement.disabled = true;
  sendButton.disabled = true;
  
  // 로딩 표시
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }
  
  // AI 응답 받기
  try {
    await getAIResponse(container);
  } catch (error) {
    console.error('Error:', error);
    addMessage(container, 'ai', '죄송해요. 오류가 발생했어요. 다시 시도해주세요. 😢');
  } finally {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    inputElement.disabled = false;
    sendButton.disabled = false;
    inputElement.focus();
  }
}

/**
 * OpenAI API를 호출하여 AI 응답을 받습니다.
 * 시스템 프롬프트 + 누적된 히스토리 + 새 메시지를 순서대로 합쳐서 전송합니다.
 */
async function getAIResponse(container) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  // 메시지 구성: system + 과거 대화 기록 + 현재 사용자 메시지
  const messages = [
    { role: 'system', content: currentPersona.systemPrompt },
    ...chatbotHistory  // 과거 대화 기록 (이미 현재 사용자 메시지 포함)
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'API 요청 실패');
  }

  const data = await response.json();
  const aiMessage = data.choices[0].message.content;
  
  // AI 응답 추가
  addMessage(container, 'ai', aiMessage);
  chatbotHistory.push({
    role: 'assistant',
    content: aiMessage
  });
  
  // 대화 내역 저장
  saveHistory();
}

/**
 * 메시지를 챗봇 창에 추가합니다.
 * @param {HTMLElement} container - 메시지 컨테이너
 * @param {string} sender - 'user' 또는 'ai'
 * @param {string} text - 메시지 내용
 * @param {boolean} scroll - 스크롤 여부 (기본값: true)
 */
function addMessage(container, sender, text, scroll = true) {
  if (!container) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chatbot-message ${sender}-message`;
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;
  
  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);
  
  // 스크롤을 맨 아래로
  if (scroll) {
    container.scrollTop = container.scrollHeight;
  }
}
