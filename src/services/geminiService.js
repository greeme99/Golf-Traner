import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Generates a one-point lesson based on the swing analysis result.
 * Prompts the model to return a structured Markdown response.
 */
export const generateOnePointLesson = async (swingResult) => {
  const metrics = swingResult.metrics || {};
  const tempo = metrics.tempo || "3.0:1";
  const spineAngle = metrics.spineAngle || "26°";
  const headMovement = metrics.headMovement || "Stable (Excellent)";

  if (!genAI) {
    // Detailed fallback report if API key is not yet bound
    return {
      title: "🎯 척추축 고정과 다운스윙 템포 맞춤 교정 레슨",
      content: `### 📊 스윙 바이오매카닉스 종합 피드백
- **촬영 각도**: ${swingResult.cameraAngle === 'side' ? '측면 (Down-The-Line)' : '정면 (Face-On)'}
- **스윙 템포 비율**: **${tempo}** (권장 템포 3.0 : 1)
- **척추각 유전성**: **${spineAngle}**
- **머리 움직임**: **${headMovement}**

---

### 💡 핵심 교정 포인트 (One-Point Drill)
1. **임팩트 시 척추각(Spine Angle) 유지**:
   - 백스윙 탑에서 다운스윙 진입 시 상체가 일어서는 **Early Extension** 증상을 방지하세요.
   - 임팩트 순간까지 엉덩이(Hip)를 뒤쪽 벽에 대고 있다는 느낌을 유지해야 합니다.

2. **3:1 템포 감각 익히기**:
   - 백스윙 시 하나-둘-셋(3초), 다운스윙 시 하나(1초)의 일정한 리듬을 카운트하세요.

---

### 🏋️ 추천 실전 연습 방법 (Practice Drill)
- **벽대고 스윙 드릴 (Wall Alignment Drill)**: 
  - 엉덩이를 벽에서 5cm 떼고 어드레스한 후, 스윙 전 과정에서 오른쪽/왼쪽 엉덩이가 벽에 닿아있도록 유지하며 스윙하세요.
`
    };
  }

  const angleStr = {
    'front': '정면 (Face On)',
    'side': '측면 (Down The Line)',
    'back': '후면 (Back View)',
    'auto': '자동 감지'
  }[swingResult.cameraAngle] || '측면 (Down The Line)';

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "당신은 PGA/LPGA 클래스A 스윙 분석 전문 헤드 프로코치입니다. 입력받은 스윙 바이오매카닉스 데이터(촬영각도, 템포, 척추각, 머리 움직임, 클럽스피드)를 기반으로 사용자에게 가장 필요한 핵심 원포인트 레슨과 실전 교정 드릴(Drill)을 친절하고 격려하는 마크다운 형식으로 작성하세요."
    });

    const prompt = `
      사용자의 스윙 분석 데이터:
      - 촬영 방향: ${angleStr}
      - 템포 (백스윙:다운스윙 비율): ${tempo}
      - 척추 유지각: ${spineAngle}
      - 머리 움직임 (Head Sway): ${headMovement}
      - 클럽 스피드: ${metrics.clubSpeed || '96 mph'}

      위 데이터를 바탕으로 가장 중요하고 긴급한 원포인트 교정 레슨 제목(Emoji 포함, 35자 내외)과, 
      상세 피드백(핵심 분석, 원포인트 레슨, 추천 연습 드릴 2가지)을 마크다운 구조로 작성해 주세요.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract first title line if available or fallback
    let title = "🎯 PGA 프로의 맞춤 스윙 레슨";
    const lines = text.split('\n');
    if (lines[0].startsWith('#')) {
      title = lines[0].replace(/^[#\s]+/, '');
    }

    return {
      title: title,
      content: text
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: "스윙 맞춤 진단 결과",
      content: `### 📊 스윙 진단 요약
- **스윙 템포**: ${tempo}
- **척추 각도**: ${spineAngle}
- **머리 움직임**: ${headMovement}

*임팩트 구간에서 척추 각도(Spine Angle)를 일정하게 유지하면 타점의 일관성이 극대화됩니다.*`
    };
  }
};

