// ================= Settings Modal Logic =================
function openSettingsModal() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    // Modal fields
    const apiKey = document.getElementById('geminiApiKey').value;
    const systemPrompt = document.getElementById('systemPromptInput').value;
    const htmlTemplate = document.getElementById('htmlTemplateInput').value;

    // Step 1 fields
    const keyword = document.getElementById('keywordInput').value;
    const productName = document.getElementById('productNameInput').value;

    localStorage.setItem('geminiApiKey', apiKey);
    localStorage.setItem('systemPrompt', systemPrompt);
    localStorage.setItem('htmlTemplateInput', htmlTemplate);
    localStorage.setItem('keywordInput', keyword);
    localStorage.setItem('productNameInput', productName);

    alert('설정이 저장되었습니다.');
    closeSettingsModal();
}

function loadSettings() {
    const apiKey = localStorage.getItem('geminiApiKey');
    const systemPrompt = localStorage.getItem('systemPrompt');
    const htmlTemplate = localStorage.getItem('htmlTemplateInput');
    const keyword = localStorage.getItem('keywordInput');
    const productName = localStorage.getItem('productNameInput');

    if (apiKey) document.getElementById('geminiApiKey').value = apiKey;
    if (systemPrompt) document.getElementById('systemPromptInput').value = systemPrompt;
    if (htmlTemplate) document.getElementById('htmlTemplateInput').value = htmlTemplate;
    if (keyword) document.getElementById('keywordInput').value = keyword;
    if (productName) document.getElementById('productNameInput').value = productName;

    // 메모 불러오기
    const memo1 = localStorage.getItem('memo1');
    const memo2 = localStorage.getItem('memo2');
    if (memo1) document.getElementById('memo1').value = memo1;
    if (memo2) document.getElementById('memo2').value = memo2;
}


// ================= Main Event Listeners =================
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // Load all saved settings on startup

    // Modal controls
    document.getElementById('settingsBtn').addEventListener('click', openSettingsModal);
    document.querySelector('.close-modal').addEventListener('click', closeSettingsModal);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    
    // Main AI generation button
    document.getElementById('aiGenerateBtn').addEventListener('click', generateListingWithAi);
    
});

// ================= Data Table Image =================
let dataTableImageData = null;

function handleDataTableImage(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result.split(',')[1];
        dataTableImageData = { mimeType: file.type, base64: base64 };
        document.getElementById('dataTableFileName').value = file.name;
    };
    reader.readAsDataURL(file);
}

function resetAll() {
    // Step 1
    document.getElementById('productNameInput').value = '';
    document.getElementById('resultText').value = '';
    document.getElementById('dataTableFileName').value = '';
    document.getElementById('dataTableInput').value = '';
    dataTableImageData = null;
    // Step 2
    document.getElementById('jsonInput').value = '';
    // Step 3
    document.getElementById('titleA').value = '';
    document.getElementById('titleB').value = '';
    document.getElementById('specsTable').innerHTML = '';
    document.getElementById('finalHtml').value = '';
    // 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= AI Generation Logic (Step 2) =================
async function generateListingWithAi() {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        alert("먼저 '⚙️ 설정'에서 Google Gemini API 키를 입력하고 저장해주세요.");
        openSettingsModal();
        return;
    }

    const systemPrompt = localStorage.getItem('systemPrompt');
    if (!systemPrompt) {
        alert("먼저 '⚙️ 설정'에서 시스템 프롬프트를 입력하고 저장해주세요.");
        openSettingsModal();
        return;
    }

    const keyword = document.getElementById('keywordInput').value.trim();
    const productName = document.getElementById('productNameInput').value.trim();
    const ocrText = document.getElementById('resultText').value.trim();

    if (!keyword) { alert('키워드를 입력해주세요.'); return; }
    if (!productName) { alert('제품명을 입력해주세요.'); return; }
    if (!ocrText) { alert('추출된 텍스트가 없습니다. 이미지를 먼저 스캔해주세요.'); return; }
    if (!dataTableImageData) { alert('데이터 테이블 이미지를 선택해주세요.'); return; }

    const aiBtn = document.getElementById('aiGenerateBtn');
    const originalBtnText = aiBtn.innerText;
    aiBtn.innerText = '⏳ 생각 중...';
    aiBtn.disabled = true;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        { text: `키워드: ${keyword}` },
                        { text: `제품명: ${productName}` },
                        { text: `추출된 데이터:\n${ocrText}` },
                        { inline_data: { mime_type: dataTableImageData.mimeType, data: dataTableImageData.base64 } }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    thinkingConfig: {
                        thinkingLevel: "HIGH"
                    }
                }
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('API Error Details:', errorBody);
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}. (${errorBody.error?.message || '세부 정보 없음'})`);
        }

        const data = await response.json();
        const parts = data.candidates[0].content.parts;

        // Gemini 3 Thinking 모델은 parts 중 thought 속성이 없는 파트가 최종 텍스트 결과임
        const mainPart = parts.find(p => p.thought === undefined);
        const jsonText = mainPart.text;

        // Prettify the JSON before displaying it
        document.getElementById('jsonInput').value = JSON.stringify(JSON.parse(jsonText), null, 2);

        // Auto-run the next step, then scroll to Step 3
        await generateListing();
        document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert('AI 리스팅 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
        aiBtn.innerText = originalBtnText;
        aiBtn.disabled = false;
    }
}
