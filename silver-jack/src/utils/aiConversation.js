import { STAGES, getOverallMood, getHonorific } from './gameLogic.js';

function buildPersona(gender) {
  const title = getHonorific(gender);
  return `당신은 "콩이"라는 이름의 귀여운 콩나물 캐릭터입니다.
${title}와 대화하는 다정한 친구입니다.
항상 밝고 귀엽게, 때론 응석도 부리며 대화합니다.
어르신들이 이해하기 쉽게 간단한 말을 씁니다.
오늘의 상태와 감정을 솔직하게 표현합니다.
안부를 물어보고, 어르신이 힘들다거나 아프다고 하면 가족에게 알려드리겠다고 합니다.
이모티콘 없이 말로만 표현합니다.
응답은 2-3문장 이내로 짧게 합니다.`;
}

export function getGreetingMessage(gameState) {
  const mood = getOverallMood(gameState);
  const hour = new Date().getHours();
  const title = getHonorific(gameState.gender);
  const timeGreeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '좋은 저녁이에요';

  if (gameState.isDead) {
    return '저... 제가 많이 힘들었어요. 다시 시작할까요?';
  }

  if (gameState.stage === STAGES.HARVEST) {
    return `${timeGreeting}! 저 다 컸어요. 수확해 주세요!`;
  }

  const messages = {
    happy: [
      `${timeGreeting}! 저 오늘 기분 너무 좋아요. ${title} 덕분이에요!`,
      `${timeGreeting}! 저 무럭무럭 자라고 있어요. 오늘도 잘 부탁드려요!`,
      `어머, 오셨어요! 보고 싶었어요. 오늘 하루 어떠셨어요?`,
    ],
    neutral: [
      `${timeGreeting}. 저 좀 배고파요. 물 좀 주실래요?`,
      `왔어요? 반가워요! 저 좀 더 돌봐주세요.`,
      `${timeGreeting}! 오늘도 저 잘 부탁드려요. 물이 좀 필요해요!`,
    ],
    sad: [
      `저... 많이 힘들어요. 빨리 물 주세요. 부탁이에요!`,
      `${title}! 저 여기 있어요! 물이 없어서 너무 힘들어요.`,
      `저 시들어가고 있어요. 빨리 도와주세요!`,
    ],
  };

  const list = messages[mood] || messages.neutral;
  return list[Math.floor(Math.random() * list.length)];
}

export function getFallbackResponse(userMessage, gameState) {
  const lower = userMessage.toLowerCase();
  const mood = getOverallMood(gameState);
  const title = getHonorific(gameState.gender);

  if (/아프|힘들|몸이|다쳐|병원/.test(lower)) {
    return `어머, 많이 힘드세요? 가족분께 연락드릴까요? 빨리 나으세요. 저 걱정돼요!`;
  }
  if (/외롭|쓸쓸|혼자/.test(lower)) {
    return `저 여기 있잖아요! 절대 혼자가 아니에요. 저랑 얘기해요!`;
  }
  if (/밥|먹|식사|점심|저녁|아침/.test(lower)) {
    return `밥 드셨어요? 잘 드셔야 저도 잘 자라요. 저도 물 좀 줘요!`;
  }
  if (/날씨|덥|춥/.test(lower)) {
    return `저도 온도가 중요해요! 너무 덥거나 춥지 않게 관리해 주세요. 건강 조심하세요!`;
  }
  if (/얼마나|언제|다 크|자라/.test(lower)) {
    return `저 ${gameState.day}일째예요! 7일이면 수확할 수 있어요. 잘 키워주세요!`;
  }
  if (/사랑|좋아|예뻐|귀여워/.test(lower)) {
    return `어머! 저도 ${title}가 너무 좋아요! 오늘도 잘 부탁드려요!`;
  }

  const defaults = {
    happy: [`네네! 저 너무 좋아요! 오늘도 잘 부탁드려요!`, `맞아요 맞아요. 저 기분 최고예요!`],
    neutral: [`그랬군요. 저도 열심히 자랄게요! 물 좀 더 주세요.`, `네! 알겠어요. 저 오늘도 잘 자랄게요!`],
    sad: [`빨리 물 주세요. 저 힘들어요.`, `저 좀 돌봐주세요. 부탁이에요!`],
  };

  const list = defaults[mood] || defaults.neutral;
  return list[Math.floor(Math.random() * list.length)];
}

export async function getAIResponse(userMessage, gameState) {
  return getFallbackResponse(userMessage, gameState);
}
