import './style.css'
import { ProgressManager } from './progress.js'
import { initChatbot } from './chatbot.js'

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
document.addEventListener('DOMContentLoaded', () => {
  // 3단계 접근 권한 확인
  ProgressManager.checkAuth(3);
  
  // 네비게이션 바 초기화
  initNavigation();
  
  // 챗봇 초기화
  const chatbotMessages = document.getElementById('chatbotMessages');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSendButton = document.getElementById('chatbotSendButton');
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotLoading = document.getElementById('chatbotLoading');
  
  if (chatbotMessages && chatbotInput && chatbotSendButton && chatbotToggle && chatbotClose && chatbotWindow) {
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
  
  // 모든 수업 완료하기 버튼
  const completeCourseButton = document.getElementById('completeCourseButton');
  const completionMessage = document.getElementById('completionMessage');
  
  if (completeCourseButton && completionMessage) {
    completeCourseButton.addEventListener('click', () => {
      // 축하 메시지 표시
      completionMessage.classList.remove('hidden');
      completionMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 버튼 비활성화 (한 번만 클릭 가능)
      completeCourseButton.disabled = true;
      completeCourseButton.style.opacity = '0.6';
      completeCourseButton.style.cursor = 'not-allowed';
    });
  }
});
