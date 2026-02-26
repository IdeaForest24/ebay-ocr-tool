// ================= STEP 3: Assembler Logic =================
async function generateListing() {
    const jsonStr = document.getElementById('jsonInput').value;
    const templateHtml = localStorage.getItem('htmlTemplateInput');

    if (!templateHtml) { 
        alert("먼저 '⚙️ 설정'에서 베이스 HTML 템플릿을 입력하고 저장해주세요!"); 
        // 설정 모달을 열어주는 것이 더 친절할 수 있습니다.
        document.getElementById('settingsModal').style.display = 'flex';
        return; 
    }
    if (!jsonStr) { 
        alert("JSON 데이터가 없습니다. Step 1, 2를 먼저 진행하세요!"); 
        return; 
    }

    try {
        const data = JSON.parse(jsonStr);
        
        // (1) 타이틀 채우기
        document.getElementById('titleA').value = data.titles.option_a || "";
        document.getElementById('titleB').value = data.titles.option_b || "";

        // (2) 스펙 테이블 생성 (확인용)
        let tableRows = "";
        for (const key in data.item_specifics) {
            if (data.item_specifics.hasOwnProperty(key)) {
                const specKey = key || "Feature";
                const specValue = data.item_specifics[key] || "N/A";
                tableRows += `<tr><th>${specKey}</th><td>${specValue}</td></tr>`;
            }
        }
        document.getElementById('specsTable').innerHTML = tableRows;
        
        // (3) 주의사항(Caution) 생성
        let cautionHtmlBlock = "";
        if (data.caution && data.caution.length > 0) {
            cautionHtmlBlock = `<div style="margin-top: 25px; background: #fff5f5; padding: 15px; border-radius: 8px;">
                <h4 style="color: #d9534f; margin-top:0;">⚠️ Caution</h4>
                <ul style="color: #555; padding-left: 20px; margin-bottom: 0;">
                    ${data.caution.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>`;
        }

        // (4) AI 마케팅 설명 (HTML) 가져오기
        const marketingHtml = data.description_html || "<p>상세 설명 데이터가 없습니다.</p>";

        // (5) 최종 콘텐츠 합체
        const fullContentBlock = marketingHtml + cautionHtmlBlock;

        // (6) 템플릿과 조립
        const marker = "<!-- REPLACE THIS SECTION WITH PRODUCT-SPECIFIC CONTENT -->";

        if (templateHtml.includes(marker)) {
            const finalCode = templateHtml.replace(marker, fullContentBlock);
            
            document.getElementById('finalHtml').value = finalCode;
            // outputArea는 이제 항상 보입니다.
        } else {
            alert("⚠️ 오류: HTML 템플릿에서 약속된 주석('<!-- REPLACE THIS SECTION... -->')을 찾을 수 없습니다.\n\n'⚙️ 설정'에서 템플릿 코드를 확인해주세요.");
        }

    } catch (e) {
        alert("❌ JSON 파싱 오류!\nAI가 생성한 데이터의 형식이 올바르지 않습니다.\n\n오류 내용: " + e.message);
    }
}
