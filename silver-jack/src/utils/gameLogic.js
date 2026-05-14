export const STAGES = {
  SOAKING:   'soaking',   // 1일: 씨앗 담그기
  GERMINATE: 'germinate', // 2일: 발아
  TINY:      'tiny',      // 3일: 새싹 출현
  GROWING:   'growing',   // 4일: 성장
  SPROUT:    'sprout',    // 5일: 콩나물
  FULL:      'full',      // 6일: 무성한 콩나물
  HARVEST:   'harvest',   // 7일: 수확
  DEAD:      'dead',
};

// 실제 콩나물 생애주기: 7일 1단계씩
export const DAY_TO_STAGE = {
  1: STAGES.SOAKING,
  2: STAGES.GERMINATE,
  3: STAGES.TINY,
  4: STAGES.GROWING,
  5: STAGES.SPROUT,
  6: STAGES.FULL,
  7: STAGES.HARVEST,
};

export const STAGE_NAMES = {
  [STAGES.SOAKING]:   '씨앗 담그기',
  [STAGES.GERMINATE]: '발아 중',
  [STAGES.TINY]:      '새싹 출현',
  [STAGES.GROWING]:   '성장 중',
  [STAGES.SPROUT]:    '콩나물',
  [STAGES.FULL]:      '무성한 콩나물',
  [STAGES.HARVEST]:   '수확 완료!',
  [STAGES.DEAD]:      '시들었어요...',
};

const WATER_DECAY_PER_HOUR = 8;
const SUNLIGHT_DECAY_PER_HOUR = 6;
const TEMP_DECAY_PER_HOUR = 5;
const DEATH_THRESHOLD_HOURS = 36;

export function createInitialState() {
  return {
    stage: STAGES.SOAKING,
    day: 1,
    water: 80,
    sunlight: 70,
    temperature: 75,
    lastCareTime: Date.now(),
    lastVisitTime: Date.now(),
    cycleStartTime: Date.now(),
    cycleCount: 0,
    isDead: false,
    userName: '',
    gender: 'female',
    familyContact: '',
    familyContactType: 'phone',
    conversationHistory: [],
    totalHarvests: 0,
    demoMode: true,
  };
}

export function getStageFromDay(day) {
  return DAY_TO_STAGE[Math.min(7, Math.max(1, day))] || STAGES.SOAKING;
}

export function computeCurrentState(savedState) {
  if (!savedState || savedState.isDead) return savedState;

  const now = Date.now();
  const hoursSinceLastCare = (now - (savedState.lastCareTime || now)) / (1000 * 60 * 60);

  if (hoursSinceLastCare > DEATH_THRESHOLD_HOURS && savedState.stage !== STAGES.HARVEST) {
    return { ...savedState, isDead: true, stage: STAGES.DEAD };
  }

  const water = Math.max(0, savedState.water - WATER_DECAY_PER_HOUR * hoursSinceLastCare);
  const sunlight = Math.max(0, savedState.sunlight - SUNLIGHT_DECAY_PER_HOUR * hoursSinceLastCare);
  const temperature = Math.max(0, savedState.temperature - TEMP_DECAY_PER_HOUR * hoursSinceLastCare);

  // 데모 모드: 1게임일 = 10분 / 실제: 1게임일 = 24시간
  const minutesPerDay = (savedState.demoMode ?? true) ? 10 : 1440;
  const minutesSinceStart = (now - (savedState.cycleStartTime || now)) / (1000 * 60);
  const day = Math.min(7, Math.floor(minutesSinceStart / minutesPerDay) + 1);
  const stage = getStageFromDay(day);

  return {
    ...savedState,
    water,
    sunlight,
    temperature,
    day,
    stage,
    lastVisitTime: now,
  };
}

export function applyWater(state) {
  return { ...state, water: Math.min(100, state.water + 40), lastCareTime: Date.now() };
}

export function applySunlight(state) {
  return { ...state, sunlight: Math.min(100, state.sunlight + 35), lastCareTime: Date.now() };
}

export function applyTemperature(state) {
  return { ...state, temperature: Math.min(100, state.temperature + 30), lastCareTime: Date.now() };
}

export function startNewCycle(state) {
  return {
    ...state,
    stage: STAGES.SOAKING,
    day: 1,
    water: 80,
    sunlight: 70,
    temperature: 75,
    isDead: false,
    lastCareTime: Date.now(),
    cycleStartTime: Date.now(),
    cycleCount: (state.cycleCount || 0) + 1,
    totalHarvests: (state.totalHarvests || 0) + 1,
    conversationHistory: [],
  };
}

export function getStatusLevel(value) {
  if (value >= 70) return 'good';
  if (value >= 40) return 'warn';
  return 'bad';
}

export function getOverallMood(state) {
  if (state.isDead) return 'dead';
  if (state.stage === STAGES.HARVEST) return 'harvest';
  const avg = (state.water + state.sunlight + state.temperature) / 3;
  if (avg >= 70) return 'happy';
  if (avg >= 40) return 'neutral';
  return 'sad';
}

export function getHonorific(gender) {
  return gender === 'male' ? '할아버지' : '할머니';
}
