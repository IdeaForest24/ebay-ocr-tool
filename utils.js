// 텍스트 복사 함수 (단일 요소)
function copyText(elementId) {
    const el = document.getElementById(elementId);
    // textarea나 input이 아닌 경우를 대비
    const value = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : el.innerText;
    
    navigator.clipboard.writeText(value).then(() => {
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "✅";
        setTimeout(() => { btn.innerText = originalText; }, 1000);
    }).catch(err => console.error('Copy failed', err));
}


// 지시문 + OCR 결과 합쳐서 복사하기
function copyCombinedText() {
    const promptText = `${document.getElementById('keywordInput').value} ${document.getElementById('productNameInput').value}`;
    const result = document.getElementById('resultText').value;

    if (!result && !promptText.trim()) {
        alert("복사할 내용이 없습니다.");
        return;
    }
    const combinedText = `Keywords: ${promptText}\n\n--- OCR Result ---\n${result}`;

    navigator.clipboard.writeText(combinedText).then(() => {
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "✅ 복사 완료!";
        btn.style.backgroundColor = "#4caf50";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "#2e7d32";
        }, 1500);
    });
}
