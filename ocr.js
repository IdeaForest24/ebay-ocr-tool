// ================= STEP 1: OCR Logic (다중 이미지 지원) =================
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
}

async function processImages(input) {
    if (!input.files || input.files.length === 0) return;
    
    const maxFiles = 20;
    let files = Array.from(input.files);
    if (files.length > maxFiles) {
        alert(`이미지는 최대 ${maxFiles}장까지만 처리됩니다.
선택하신 파일 중 앞쪽 ${maxFiles}장만 진행합니다.`);
        files = files.slice(0, maxFiles);
    }

    const status = document.getElementById('ocrStatus');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const resultArea = document.getElementById('resultText');
    
    resultArea.value = "";
    if (progressBar) progressBar.style.display = 'block';
    if (progressFill) progressFill.style.width = '0%';
    
    let fullResultText = "";
    
    if (status) status.innerText = "OCR 엔진 초기화 중...";
    const worker = await Tesseract.createWorker('kor+eng'); 

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileNum = i + 1;
            if (status) status.innerText = `[${fileNum}/${files.length}] 이미지 처리 중... (${file.name})`;
            
            const img = await loadImage(file);
            
            const sliceHeight = 1500; 
            const totalSlices = Math.ceil(img.height / sliceHeight);
            
            let fileText = `
=== [Image ${fileNum}: ${file.name}] ===
`;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;

            for (let j = 0; j < totalSlices; j++) {
                const y = j * sliceHeight;
                const h = Math.min(sliceHeight, img.height - y);
                
                canvas.height = h;
                ctx.drawImage(img, 0, y, img.width, h, 0, 0, img.width, h);
                
                const { data: { text } } = await worker.recognize(canvas);
                fileText += text + "\n";
                
                const currentFileProgress = (j + 1) / totalSlices;
                const totalProgress = ((i + currentFileProgress) / files.length) * 100;
                if (progressFill) progressFill.style.width = `${totalProgress}%`;
            }
            
            fullResultText += fileText + "\n";
            resultArea.value = fullResultText;
            resultArea.scrollTop = resultArea.scrollHeight;
        }
        
        if (status) status.innerText = `✅ 총 ${files.length}장 텍스트 추출 완료!`;
        
    } catch (e) {
        console.error(e);
        if (status) status.innerText = "❌ 오류 발생: " + e.message;
        alert("처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
        if (worker) await worker.terminate();
    }
}
