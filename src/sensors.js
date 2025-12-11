import './style.css'
import { ProgressManager } from './progress.js'
import { initChatbot } from './chatbot.js'

// 센서 데이터 정의
const sensors = [
  {
    id: 'led',
    name: '발광 다이오드 (LED)',
    image: '/sencors/led.png',
    description: '전기에너지를 빛에너지로 변환하는 반도체야. 긴 다리가 (+), 짧은 다리가 (-)극이라는 점을 꼭 기억해야 해.'
  },
  {
    id: 'ir_sensor',
    name: '적외선 센서',
    image: '/sencors/ir_sensor.png',
    description: '눈에 보이지 않는 적외선을 쏘고, 물체에 반사되어 돌아오는 양을 감지해. 자동문이나 리모컨에 쓰여.'
  },
  {
    id: 'ultrasonic',
    name: '초음파 센서',
    image: '/sencors/ultrasonic.png',
    description: '초음파를 발사한 뒤 벽에 부딪혀 돌아오는 시간을 계산해서 거리를 측정해. 자동차 후방 감지기에 주로 쓰여.'
  },
  {
    id: 'piezo',
    name: '피에조 부저',
    image: '/sencors/piezo.png',
    description: '전기 신호를 얇은 판의 떨림으로 바꿔서 소리를 내는 부품이야. 전자식 알람 소리를 만들 때 사용해.'
  },
  {
    id: 'resistor',
    name: '저항',
    image: '/sencors/resistor.png',
    description: '회로에 흐르는 전류의 양을 조절해서 다른 부품이 타지 않도록 보호해주는 \'전기 댐\' 역할을 해.'
  },
  {
    id: 'button_switch',
    name: '버튼 스위치 (Tact Switch)',
    image: '/sencors/button_switch.png',
    description: '누르고 있을 때만 전기가 흐르고 손을 떼면 끊어지는 스위치야. 컴퓨터 키보드나 엘리베이터 버튼, 게임기 컨트롤러에 주로 쓰여.'
  },
  {
    id: 'slide_switch',
    name: '슬라이드 스위치 (Slide Switch)',
    image: '/sencors/slide_switch.png',
    description: '손잡이를 옆으로 밀어서 켜거나 끌 수 있는 스위치야. 한 번 밀어두면 상태가 고정되기 때문에 장난감 전원 스위치나 손전등에 많이 사용해.'
  },
  {
    id: 'potentiometer',
    name: '가변저항기 (Potentiometer)',
    image: '/sencors/potentiometer.png',
    description: '손잡이를 돌려서 저항값을 마음대로 조절할 수 있는 부품이야. 스피커의 볼륨을 키우거나 조명의 밝기를 미세하게 조절할 때 사용해.'
  },
  {
    id: 'cds',
    name: '광센서 (CdS)',
    image: '/sencors/cds.png',
    description: '빛의 밝기에 따라 저항값이 변하는 성질을 이용해. 어두워지면 저항이 커져서 가로등을 켜는 원리에 쓰여.'
  },
  {
    id: 'servo',
    name: '서보모터',
    image: '/sencors/servo.png',
    description: '360도 회전하는 게 아니라, 입력한 신호에 따라 0도~180도 사이의 정확한 각도로 움직여. 로봇 관절에 딱이지.'
  },
  {
    id: 'dc_motor',
    name: 'DC모터',
    image: '/sencors/dc_motor.png',
    description: '전기를 연결하면 계속 쌩쌩 돌아가는 모터야. 선풍기나 미니카의 바퀴를 생각하면 돼.'
  },
  {
    id: 'tilt',
    name: '기울기 센서',
    image: '/sencors/tilt.png',
    description: '원통 안에 작은 구슬이 들어있어서, 물체가 기울어지면 구슬이 굴러가 전기를 연결하거나 끊어줘.'
  }
];

// 게임 상태
let gameSensors = []; // 게임에 사용될 5개 센서
let correctAnswers = 0; // 정답 개수
let incorrectAnswers = 0; // 오답 개수

// 챗봇 관련 코드는 chatbot.js 모듈로 이동됨

// DOM 요소
const studyMode = document.getElementById('studyMode');
const gameMode = document.getElementById('gameMode');
const sensorsGrid = document.getElementById('sensorsGrid');
const startGameModeButton = document.getElementById('startGameModeButton');
const backToStudyButton = document.getElementById('backToStudyButton');
const restartGameButton = document.getElementById('restartGameButton');
const backToHomeButton = document.getElementById('backToHomeButton');
const backToHomeButtonComplete = document.getElementById('backToHomeButtonComplete');
const dragItems = document.getElementById('dragItems');
const dropItems = document.getElementById('dropItems');
const gameCompleteScreen = document.getElementById('gameCompleteScreen');
const nextPageButton = document.getElementById('nextPageButton');
const studyNextPageButton = document.getElementById('studyNextPageButton');
const correctCountElement = document.getElementById('correctCount');
const incorrectCountElement = document.getElementById('incorrectCount');
const finalCorrectCountElement = document.getElementById('finalCorrectCount');
const finalIncorrectCountElement = document.getElementById('finalIncorrectCount');

// 챗봇 DOM 요소
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSendButton = document.getElementById('chatbotSendButton');
const chatbotLoading = document.getElementById('chatbotLoading');

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
  // 2단계 접근 권한 확인
  ProgressManager.checkAuth(2);
  
  // 페이지 로드 성공 시 2단계 해제
  ProgressManager.unlockStage(2);
  
  // 네비게이션 바 초기화
  initNavigation();
  
  // 모달 이벤트 초기화
  initModalEvents();
  
  renderSensorCards();
  
  // 모드 전환 버튼
  startGameModeButton.addEventListener('click', switchToGameMode);
  backToStudyButton.addEventListener('click', switchToStudyMode);
  if (restartGameButton) {
    restartGameButton.addEventListener('click', () => {
      gameCompleteScreen.classList.add('hidden');
      // 다음 페이지 버튼 숨기기
      if (nextPageButton) {
        nextPageButton.style.display = 'none';
      }
      // 축하 메시지 숨기기
      const congratulationsMessage = document.getElementById('congratulationsMessage');
      if (congratulationsMessage) {
        congratulationsMessage.style.display = 'none';
      }
      switchToGameMode();
    });
  }
  
  // 뒤로가기 버튼 (1페이지로 이동)
  backToHomeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  backToHomeButtonComplete.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  
  // 다음 페이지 버튼 (게임 완료 화면) - 게임 클리어 시에만 표시됨
  if (nextPageButton) {
    // 초기에 버튼 숨기기
    nextPageButton.style.display = 'none';
    
    nextPageButton.addEventListener('click', () => {
      // 3단계 해제
      ProgressManager.unlockStage(3);
      window.location.href = 'practice.html';
    });
  }
  
  // 다음 페이지 버튼 (학습 모드) - 사용하지 않음 (게임 클리어 후에만 다음 페이지로 이동 가능)
  if (studyNextPageButton) {
    // 초기에 버튼 숨기기 (이미 HTML에서 hidden 처리됨)
    studyNextPageButton.style.display = 'none';
  }
  
  // 챗봇 초기화
  initChatbot({
    messagesContainer: chatbotMessages,
    inputElement: chatbotInput,
    sendButton: chatbotSendButton,
    toggleButton: chatbotToggle,
    closeButton: chatbotClose,
    windowElement: chatbotWindow,
    loadingIndicator: chatbotLoading,
    titleElement: document.querySelector('.chatbot-header h3'),
    clearButton: document.getElementById('chatbotClear')
  });
}

// 센서 카드 렌더링 (학습 모드)
function renderSensorCards() {
  sensors.forEach(sensor => {
    const card = document.createElement('div');
    card.className = 'sensor-card';
    card.dataset.sensorId = sensor.id; // 센서 ID를 데이터 속성으로 저장
    card.innerHTML = `
      <div class="sensor-image-wrapper">
        <img src="${sensor.image}" alt="${sensor.name}" class="sensor-image" />
      </div>
      <div class="sensor-info">
        <h3 class="sensor-name">${sensor.name}</h3>
        <p class="sensor-description">${sensor.description}</p>
      </div>
    `;
    
    // 센서 카드 클릭 이벤트 추가 (학습 모드에서만)
    card.addEventListener('click', () => {
      openSensorModal(sensor);
    });
    
    // 클릭 가능하다는 것을 시각적으로 표시
    card.style.cursor = 'pointer';
    
    sensorsGrid.appendChild(card);
  });
}

// 센서 모달 열기
function openSensorModal(sensor) {
  const modal = document.getElementById('sensorModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  
  // 모달 내용 업데이트
  modalImage.src = sensor.image;
  modalImage.alt = sensor.name;
  modalTitle.textContent = sensor.name;
  modalDescription.textContent = sensor.description;
  
  // 모달 표시
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

// 센서 모달 닫기
function closeSensorModal() {
  const modal = document.getElementById('sensorModal');
  modal.classList.add('hidden');
  document.body.style.overflow = ''; // 배경 스크롤 복원
}

// 모달 이벤트 초기화
function initModalEvents() {
  const modal = document.getElementById('sensorModal');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalCloseButton = document.getElementById('modalCloseButton');
  
  // 닫기 버튼 클릭
  if (modalClose) {
    modalClose.addEventListener('click', closeSensorModal);
  }
  
  if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeSensorModal);
  }
  
  // 오버레이 클릭 (모달 바깥 영역)
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeSensorModal);
  }
  
  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeSensorModal();
    }
  });
  
  // 모달 내용 클릭 시 닫히지 않도록 (이벤트 전파 방지)
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

// 학습 모드로 전환
function switchToStudyMode() {
  studyMode.classList.remove('hidden');
  gameMode.classList.add('hidden');
  gameCompleteScreen.classList.add('hidden');
  
  // 게임 상태 초기화
  correctAnswers = 0;
  gameSensors = [];
  
  // 다음 페이지 버튼 숨기기
  if (nextPageButton) {
    nextPageButton.style.display = 'none';
  }
  if (studyNextPageButton) {
    studyNextPageButton.style.display = 'none';
  }
  
  // 축하 메시지 숨기기
  const congratulationsMessage = document.getElementById('congratulationsMessage');
  if (congratulationsMessage) {
    congratulationsMessage.style.display = 'none';
  }
}

// 게임 모드로 전환
function switchToGameMode() {
  studyMode.classList.add('hidden');
  gameMode.classList.remove('hidden');
  gameCompleteScreen.classList.add('hidden');
  
  // 다음 페이지 버튼 숨기기
  if (nextPageButton) {
    nextPageButton.style.display = 'none';
  }
  
  // 축하 메시지 숨기기
  const congratulationsMessage = document.getElementById('congratulationsMessage');
  if (congratulationsMessage) {
    congratulationsMessage.style.display = 'none';
  }
  
  // 게임 시작
  startGame();
}

// 게임 시작
function startGame() {
  // 게임 상태 초기화
  correctAnswers = 0;
  incorrectAnswers = 0;
  gameCompleteScreen.classList.add('hidden');
  
  // 다음 페이지 버튼 숨기기
  if (nextPageButton) {
    nextPageButton.style.display = 'none';
  }
  
  // 축하 메시지 숨기기
  const congratulationsMessage = document.getElementById('congratulationsMessage');
  if (congratulationsMessage) {
    congratulationsMessage.style.display = 'none';
  }
  
  // 점수 표시 업데이트
  updateScore();
  
  // 랜덤으로 5개 센서 선택
  const shuffled = [...sensors].sort(() => Math.random() - 0.5);
  gameSensors = shuffled.slice(0, 5);
  
  // 게임 화면 구성
  renderGame();
}

// 점수 업데이트
function updateScore() {
  if (correctCountElement) {
    correctCountElement.textContent = correctAnswers;
  }
  if (incorrectCountElement) {
    incorrectCountElement.textContent = incorrectAnswers;
  }
}

// 게임 화면 렌더링
function renderGame() {
  // 드래그 아이템 초기화
  dragItems.innerHTML = '';
  
  // 드롭 아이템 초기화
  dropItems.innerHTML = '';
  
  // 설명 텍스트를 랜덤하게 섞기
  const shuffledDescriptions = [...gameSensors]
    .map(s => s.description)
    .sort(() => Math.random() - 0.5);
  
  // 드래그 가능한 이미지들 생성
  gameSensors.forEach((sensor, index) => {
    const dragItem = document.createElement('div');
    dragItem.className = 'drag-item';
    dragItem.draggable = true;
    dragItem.dataset.sensorId = sensor.id;
    dragItem.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = sensor.image;
    img.alt = sensor.name;
    img.draggable = false; // 이미지 자체는 드래그 불가
    
    dragItem.appendChild(img);
    
    // 드래그 이벤트
    dragItem.addEventListener('dragstart', handleDragStart);
    dragItem.addEventListener('dragend', handleDragEnd);
    
    dragItems.appendChild(dragItem);
  });
  
  // 드롭 존들 생성
  shuffledDescriptions.forEach((description, index) => {
    const dropItem = document.createElement('div');
    dropItem.className = 'drop-item';
    dropItem.dataset.index = index;
    
    // 해당 설명에 맞는 센서 찾기
    const matchingSensor = gameSensors.find(s => s.description === description);
    dropItem.dataset.correctSensorId = matchingSensor.id;
    
    dropItem.innerHTML = `<p>${description}</p>`;
    
    // 드롭 이벤트
    dropItem.addEventListener('dragover', handleDragOver);
    dropItem.addEventListener('drop', handleDrop);
    dropItem.addEventListener('dragenter', handleDragEnter);
    dropItem.addEventListener('dragleave', handleDragLeave);
    
    dropItems.appendChild(dropItem);
  });
}

// 드래그 시작
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  e.dataTransfer.setData('sensorId', this.dataset.sensorId);
}

// 드래그 종료
function handleDragEnd(e) {
  this.style.opacity = '1';
  
  // 모든 드롭 존에서 hover 효과 제거
  document.querySelectorAll('.drop-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

// 드래그 오버
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

// 드래그 엔터
function handleDragEnter(e) {
  if (!this.classList.contains('matched')) {
    this.classList.add('drag-over');
  }
}

// 드래그 리브
function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

// 드롭
function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  this.classList.remove('drag-over');
  
  if (this.classList.contains('matched')) {
    return false;
  }
  
  const sensorId = e.dataTransfer.getData('sensorId');
  const correctSensorId = this.dataset.correctSensorId;
  
  // 정답 체크
  if (sensorId === correctSensorId) {
    // 정답
    this.classList.add('matched', 'correct');
    this.innerHTML = `
      <div class="correct-feedback">딩동댕! ✓</div>
      <p>${gameSensors.find(s => s.id === sensorId).description}</p>
      <img src="${gameSensors.find(s => s.id === sensorId).image}" alt="${gameSensors.find(s => s.id === sensorId).name}" class="matched-image" />
    `;
    
    // 드래그 아이템 숨기기
    const dragItem = document.querySelector(`[data-sensor-id="${sensorId}"]`);
    if (dragItem) {
      dragItem.style.display = 'none';
    }
    
    correctAnswers++;
    updateScore();
    
    // 게임 완료 체크
    if (correctAnswers === 5) {
      // 게임 클리어 시 3단계 해제
      ProgressManager.unlockStage(3);
      
      setTimeout(() => {
        // 최종 점수 표시
        if (finalCorrectCountElement) {
          finalCorrectCountElement.textContent = correctAnswers;
        }
        if (finalIncorrectCountElement) {
          finalIncorrectCountElement.textContent = incorrectAnswers;
        }
        
        // 축하 메시지 표시
        const congratulationsMessage = document.getElementById('congratulationsMessage');
        if (congratulationsMessage) {
          congratulationsMessage.style.display = 'block';
        }
        
        // 게임 완료 화면 표시
        gameCompleteScreen.classList.remove('hidden');
        
        // 다음 페이지 버튼 표시 (게임 클리어 시에만)
        if (nextPageButton) {
          nextPageButton.style.display = 'block';
        }
      }, 500);
    }
  } else {
    // 오답
    incorrectAnswers++;
    updateScore();
    
    this.classList.add('incorrect');
    
    // 흔들림 애니메이션
    this.style.animation = 'shake 0.5s';
    
    setTimeout(() => {
      this.classList.remove('incorrect', 'drag-over');
      this.style.animation = '';
    }, 500);
    
    // 드래그 아이템 원위치
    if (draggedElement) {
      draggedElement.style.opacity = '1';
    }
  }
  
  return false;
}

// 챗봇 관련 함수는 chatbot.js 모듈로 이동됨

// 앱 시작
init();