// 問題を取得して表示する関数
function fetchQuestions() {
    fetch('/api/questions')
        .then(response => response.json())
        .then(questions => {
            const container = document.getElementById('quiz-container');
            questions.forEach((question, index) => {
                const questionElem = document.createElement('div');
                questionElem.setAttribute('data-question-id', question.id);
                questionElem.innerHTML = `<p>問題${index + 1}: ${question.question}</p>` +
                    question.choices.map((choice, choiceIndex) =>
                        `<label><input type="radio" name="question${question.id}" value="${choiceIndex + 1}"> ${choice}</label>`
                    ).join('<br>');
                container.appendChild(questionElem);
            });

            // 解答率の更新イベントリスナーを追加
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    // 解答するたびに解答率とプログレスバーを更新
                    updateAnswerRate(questions.length); // 解答率を更新
                    updateProgressBarForAnswerRate(questions.length); // プログレスバーを更新
                });
            });

            // 初期表示時にも解答率とプログレスバーを更新
            updateAnswerRate(questions.length); // 解答率を更新
            updateProgressBarForAnswerRate(questions.length); // プログレスバーを更新

            // プログレスバーに目盛りを追加
            addProgressTicks(questions.length);
        });
}

document.getElementById('download-pdf').addEventListener('click', function() {
    // 確認メッセージを表示し、ユーザーの選択を取得
    const isConfirmed = confirm("PDFを保存しますか？");

    // ユーザーがOKを選択した場合のみPDFを生成
    if (isConfirmed) {
        generatePDF();
    }
});

function generatePDF() {
    const pdf = new window.jspdf.jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const scale = window.devicePixelRatio; // デバイスのピクセル比を考慮
    const totalHeight = document.body.scrollHeight * scale; // スケールを考慮した全高
    const totalPages = Math.ceil(totalHeight / (pageHeight * scale)); // スケールを考慮したページ数

    let currentPage = 0;

    function capturePageAndAdd(scrollY) {
        html2canvas(document.body, {
            scrollY: scrollY,
            scale: scale, // html2canvasにデバイスのピクセル比を指定
            windowHeight: pageHeight * scale, // スケールを考慮したキャプチャ高さ
            windowWidth: document.documentElement.offsetWidth // オフセット幅を使用
        }).then(canvas => {
            if (currentPage > 0) {
                pdf.addPage();
            }
            
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
            currentPage++;

            if (currentPage < totalPages) {
                capturePageAndAdd(scrollY + pageHeight * scale); // 次のページのキャプチャ開始位置を更新
            } else {
                pdf.save("download.pdf");
            }
        });
    }

    capturePageAndAdd(0); // 最初のページのキャプチャを開始
}



// 解答率を更新する関数
function updateAnswerRate(totalQuestions) {
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    document.getElementById('answerRate').textContent = `解答率：${answeredQuestions}/${totalQuestions} 問`;
}

// プログレスバーを更新する関数
function updateProgressBarForAnswerRate(totalQuestions) {
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    const answerRate = (answeredQuestions / totalQuestions) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${answerRate}%`;
}

// プログレスバーに目盛りを追加する関数
function addProgressTicks(totalQuestions) {
    const progressBarContainer = document.getElementById('progressContainer');
    // 既存の目盛りをクリア
    progressBarContainer.querySelectorAll('.progress-tick').forEach(tick => tick.remove());

    if (totalQuestions > 1) { // 問題数が1以上の場合にのみ目盛りを追加
        for (let i = 0; i < totalQuestions; i++) {
            const tick = document.createElement('div');
            tick.classList.add('progress-tick');
            // プログレスバー全体に対する目盛りの正確な位置を計算
            // 最初と最後の目盛りをプログレスバーの端に配置
            const position = (100 * i) / (totalQuestions - 0);
            tick.style.left = `${position}%`;
            progressBarContainer.appendChild(tick);
        }
    }
}

// 問題を提出する関数
function submitAnswers() {
    const answers = {};
    document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        const questionId = input.name.replace('question', '');
        answers[questionId] = parseInt(input.value);
    });
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({answers}),
    })
    .then(response => response.json())
    .then(data => {
        const resultElement = document.getElementById('result');
        resultElement.innerHTML = `採点結果: ${data.score}点`;

        const totalQuestions = data.results.length;
        let correctAnswers = data.results.filter(result => result.is_correct).length;
        let accuracy = (correctAnswers / totalQuestions) * 100;
        resultElement.innerHTML += `<br>正解率: ${accuracy.toFixed(2)}%`;

        scrollToTop();

        document.querySelectorAll('.progress-mark').forEach(mark => {
            mark.style.display = "block";
        });

        data.results.forEach(result => {
            const questionElem = document.querySelector(`[data-question-id="${result.question_id}"]`);
            const existingResult = questionElem.querySelector('.result');
            if (existingResult) {
                questionElem.removeChild(existingResult);
            }
            const resultElem = document.createElement('div');
            resultElem.classList.add('result');
            resultElem.textContent = result.is_correct ? '正解' : '不正解';
            resultElem.style.color = result.is_correct ? 'green' : 'red';
            questionElem.appendChild(resultElem);
        });

        // プログレスバーのアニメーションをリセットし、正解率に基づいてアニメーションを開始
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '0%'; // アニメーションのリセット
        setTimeout(() => animateProgressBar(accuracy), 100); // 少し遅延を入れてからアニメーション開始
    });
}

// ページの最上部にスクロールする関数
function scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function animateProgressBar(finalWidth) {
    const progressBar = document.getElementById('progressBar');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= finalWidth) {
            clearInterval(interval);
        } else {
            width++;
            progressBar.style.width = width + '%';
            if (width <= 33) {
                progressBar.style.backgroundColor = 'red';
            } else if (width <= 66) {
                progressBar.style.backgroundColor = 'yellow';
            } else {
                progressBar.style.backgroundColor = 'green';
            }
        }
    }, 30);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('submit-button').addEventListener('click', showCustomConfirm);
});

function showCustomConfirm() {
    document.getElementById('customConfirm').style.display = 'block';
}

document.getElementById('confirmOk').addEventListener('click', function() {
    document.getElementById('customConfirm').style.display = 'none';
    submitAnswers();
});

document.getElementById('confirmCancel').addEventListener('click', function() {
    document.getElementById('customConfirm').style.display = 'none';
});

function updateAnswerRate(totalQuestions) {
const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
document.getElementById('answerRate').textContent = `解答率：${answeredQuestions}/${totalQuestions} 問`;
}

window.onload = fetchQuestions;
