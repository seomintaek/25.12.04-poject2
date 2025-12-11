/**
 * 학습 진도 관리 모듈
 * localStorage를 활용하여 사용자의 학습 단계(Stage)를 관리하고 페이지 이동 권한을 제어합니다.
 */

const STORAGE_KEY = 'my_maker_project_stage';

/**
 * ProgressManager 클래스
 * 학습 진도를 관리하고 페이지 접근 권한을 제어합니다.
 */
export class ProgressManager {
  /**
   * 해당 단계까지 도달했음을 저장합니다.
   * 이미 더 높은 단계에 도달했다면 낮은 단계로 되돌리지 않습니다.
   * @param {number} stageNum - 도달한 단계 번호 (1, 2, 3)
   */
  static unlockStage(stageNum) {
    const currentStage = this.getCurrentStage();
    // 현재 단계가 목표 단계보다 높거나 같으면 업데이트하지 않음
    if (currentStage >= stageNum) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, stageNum.toString());
  }

  /**
   * 현재 저장된 학습 단계를 반환합니다.
   * @returns {number} 현재 단계 (기본값: 1)
   */
  static getCurrentStage() {
    const stage = localStorage.getItem(STORAGE_KEY);
    return stage ? parseInt(stage, 10) : 1;
  }

  /**
   * 해당 페이지에 접근할 자격이 있는지 확인합니다.
   * @param {number} stageNum - 접근하려는 페이지의 단계 번호
   * @returns {boolean} 접근 가능 여부
   */
  static canAccess(stageNum) {
    const currentStage = this.getCurrentStage();
    return currentStage >= stageNum;
  }

  /**
   * 현재 페이지에 접근 권한이 없으면 경고창을 띄우고 index.html로 강제 이동시킵니다.
   * @param {number} requiredStage - 현재 페이지에 필요한 최소 단계
   */
  static checkAuth(requiredStage) {
    if (!this.canAccess(requiredStage)) {
      alert(`아직 ${requiredStage}단계를 완료하지 않았습니다. 먼저 이전 단계를 완료해주세요!`);
      window.location.href = 'index.html';
    }
  }
}

