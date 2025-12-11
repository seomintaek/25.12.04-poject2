import './style.css'
import { ProgressManager } from './progress.js'

// 대화 단계 관리
let step = 0;
let conversationHistory = [];

// 보유 센서 목록
const AVAILABLE_SENSORS = [
  '발광 다이오드(LED)',
  '적외선 센서',
  '초음파 센서',
  '피에조 부저',
  '저항',
  '광센서',
  '트랜지스터',
  '서보모터',
  'DC모터',
  '기울기 센서'
];

// 아이디어 예시 목록 (불편함 해결 + 재미있는 장난감)
const IDEA_EXAMPLES = [
  '밤에 너무 어두워요',
  '움직이는 로봇을 만들고 싶어요',
  '반짝이는 무드등을 만들래요',
  '빙글빙글 도는 인형을 만들고 싶어요',
  '불이 들어오는 칼을 만들고 싶어요',
  '문 앞에 누가 왔는지 모르겠어요',
  '음악이 나오는 상자를 만들래요',
  '식물이 말라죽어요',
  '깜빡이는 장난감을 만들고 싶어요',
  '움직이는 자동차 장난감을 만들래요'
];

// DOM 요소
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const nextPageContainer = document.getElementById('nextPageContainer');
const nextPageButton = document.getElementById('nextPageButton');
const newChatButton = document.getElementById('newChatButton');

// 시스템 프롬프트 설정
const SYSTEM_PROMPT = `당신은 학생의 아이디어를 실현해주는 메이커 선생님입니다. 
초등학생과 대화하며 전자제품 아이디어를 구체화하는 것을 도와주세요.

중요한 규칙:
1. 반드시 아래 10가지 센서 중에서만 추천해야 합니다:
   - 발광 다이오드(LED)
   - 적외선 센서
   - 초음파 센서
   - 피에조 부저
   - 저항
   - 광센서
   - 트랜지스터
   - 서보모터
   - DC모터
   - 기울기 센서

2. 대화는 4단계로 진행됩니다:
   - Step 1: 아이디어 탐색 (불편함 해결 또는 재미있는 장난감)
   - Step 2: 구체화 질문
   - Step 3: 센서 추천 및 이유 설명
   - Step 4: 마무리 멘트

3. 학생이 꼭 심각한 사회 문제를 해결하려고 하지 않아도 됩니다.
   - "그냥 불이 들어오는 칼을 만들고 싶어"나 "빙글빙글 도는 인형을 만들래" 같은 단순한 흥미 위주의 아이디어도 적극적으로 칭찬하고 받아주세요.
   - 해결책보다는 '어떻게 재미있게 구현할지'에 초점을 맞춰서 답변해주세요.

4. 친절하고 격려하는 톤으로 대화하세요.
5. 학생의 아이디어를 칭찬하고 긍정적으로 피드백을 주세요.
6. 추천할 때는 반드시 위 목록에 있는 센서만 언급하고, 이유를 설명하세요.
7. 장난감이나 재미있는 작품을 만들 때는 서보모터, LED, 피에조 부저 등 동작과 효과를 내기 좋은 센서를 자연스럽게 추천해주세요.`;

// 네비게이션 바 초기화
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const currentStage = ProgressManager.getCurrentStage();
  
  navItems.forEach(item => {
    const stageNum = parseInt(item.dataset.stage, 10);
    const currentPage = window.location.pathname.includes('index.html') ? 1 :
                       window.location.pathname.includes('sencors.html') ? 2 : 3;
    
    // 현재 페이지 표시
    if (stageNum === currentPage) {
      item.classList.add('active');
    }
    
    // 잠금 처리
    if (currentStage < stageNum) {
      item.classList.add('locked');
      item.href = '#';
      item.addEventListener('click', (e) => {
        e.preventDefault();
        alert(`아직 ${stageNum}단계를 완료하지 않았습니다. 먼저 이전 단계를 완료해주세요!`);
      });
    }
  });
}

// 초기화
function init() {
  // 네비게이션 바 초기화
  initNavigation();
  
  // Enter 키로 전송
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 전송 버튼 클릭
  sendButton.addEventListener('click', sendMessage);

  // 다음 페이지 버튼
  nextPageButton.addEventListener('click', () => {
    window.location.href = 'sencors.html';
  });

  // 새로운 대화 시작 버튼
  newChatButton.addEventListener('click', startNewConversation);

  // Step 1 시작 - AI가 먼저 질문
  startConversation();
}

// 대화 시작
async function startConversation() {
  step = 1;
  const initialMessage = "안녕하세요! 저는 발명 선생님이에요! 🎓\n\n다양한 센서를 활용하여 우리 생활의 불편한 점을 해결해 보거나, 아니면 나만의 재미있는 장난감을 만들어볼까요?\n\n어떤 것이든 좋아요! '움직이는 로봇'이나 '반짝이는 무드등'처럼 만들고 싶은 게 있다면 이야기해 주세요. 아래 예시 중에서 선택하거나 직접 입력해주세요!";
  
  addMessage('ai', initialMessage);
  conversationHistory.push({
    role: 'assistant',
    content: initialMessage
  });
  
  // 예시 버튼들 표시
  showExampleButtons();
  
  userInput.focus();
}

// 예시 버튼들 표시
function showExampleButtons() {
  const exampleContainer = document.createElement('div');
  exampleContainer.className = 'example-buttons-container';
  exampleContainer.id = 'exampleButtonsContainer';
  
  // 6개의 예시만 랜덤하게 선택
  const shuffled = [...IDEA_EXAMPLES].sort(() => 0.5 - Math.random());
  const selectedExamples = shuffled.slice(0, 6);
  
  selectedExamples.forEach(example => {
    const button = document.createElement('button');
    button.className = 'example-button';
    button.textContent = example;
    button.addEventListener('click', () => {
      selectExample(example);
    });
    exampleContainer.appendChild(button);
  });
  
  chatContainer.appendChild(exampleContainer);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 예시 선택
function selectExample(example) {
  // 예시 버튼들 숨기기
  const exampleContainer = document.getElementById('exampleButtonsContainer');
  if (exampleContainer) {
    exampleContainer.remove();
  }
  
  // 선택한 예시를 입력창에 넣고 전송
  userInput.value = example;
  sendMessage();
}

// 새로운 대화 시작
function startNewConversation() {
  // 상태 초기화
  step = 0;
  conversationHistory = [];
  
  // 채팅창 비우기
  chatContainer.innerHTML = '';
  
  // 다음 페이지 버튼 숨기기
  nextPageContainer.style.display = 'none';
  
  // 입력창 활성화
  userInput.disabled = false;
  sendButton.disabled = false;
  
  // 새로운 대화 시작
  startConversation();
}

// 메시지 전송
async function sendMessage() {
  const message = userInput.value.trim();
  
  if (!message) return;
  
  // 예시 버튼들 숨기기 (Step 1에서 메시지 전송 시)
  if (step === 1) {
    const exampleContainer = document.getElementById('exampleButtonsContainer');
    if (exampleContainer) {
      exampleContainer.remove();
    }
  }
  
  // 사용자 메시지 추가
  addMessage('user', message);
  conversationHistory.push({
    role: 'user',
    content: message
  });
  
  // 입력창 초기화
  userInput.value = '';
  userInput.disabled = true;
  sendButton.disabled = true;
  
  // 로딩 표시
  showLoading();
  
  // AI 응답 받기
  try {
    step++;
    await getAIResponse();
  } catch (error) {
    console.error('Error:', error);
    addMessage('ai', '죄송해요. 오류가 발생했어요. 다시 시도해주세요. 😢');
  } finally {
    hideLoading();
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// AI 응답 받기
async function getAIResponse() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.');
  }

  // Step에 따른 프롬프트 조정
  let stepPrompt = '';
  if (step === 2) {
    stepPrompt = '사용자가 아이디어(불편함 해결 또는 재미있는 장난감)를 제시했으니, 적극적으로 칭찬하고 호기심을 보여주세요. 그다음 "어떻게 재미있게 구현하면 좋을까요?" 또는 "구체적으로 어떻게 움직이거나 작동하면 좋을까요?"처럼 아이디어를 구체화하는 질문을 해주세요.';
  } else if (step === 3) {
    stepPrompt = '사용자가 구체적인 구현 방법을 제시했으니, 칭찬해주고 그 구현에 맞는 센서를 위 10가지 목록 중에서 골라 추천하며 이유를 설명하세요. 장난감이나 재미있는 작품을 만들 때는 서보모터, LED, 피에조 부저 등 동작과 효과를 내기 좋은 센서를 자연스럽게 추천해주세요. 반드시 목록에 있는 센서만 추천하세요.';
  } else if (step === 4) {
    stepPrompt = '이제 마무리 멘트를 해주세요. "멋진 아이디어네요! 이제 다음 페이지에서 센서들을 자세히 알아볼까요?"와 비슷한 내용으로 마무리하세요.';
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + (stepPrompt ? '\n\n' + stepPrompt : '') },
    ...conversationHistory
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
  
  addMessage('ai', aiMessage);
  conversationHistory.push({
    role: 'assistant',
    content: aiMessage
  });

  // Step 4 완료 시 다음 페이지 버튼 표시 및 완료 상태 저장
  if (step === 4) {
    // 2단계 해제 (다음 페이지로 갈 수 있게)
    ProgressManager.unlockStage(2);
    
    setTimeout(() => {
      nextPageContainer.style.display = 'block';
      nextPageContainer.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  }
}

// 메시지 추가
function addMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;
  
  messageDiv.appendChild(bubble);
  chatContainer.appendChild(messageDiv);
  
  // 스크롤을 맨 아래로
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 로딩 표시
function showLoading() {
  loadingIndicator.style.display = 'flex';
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 로딩 숨기기
function hideLoading() {
  loadingIndicator.style.display = 'none';
}

// 앱 시작
init();