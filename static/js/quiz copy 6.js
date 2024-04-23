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


            html2canvas(document.body, {
                scale: 1,
                useCORS: true, // 外部リソースに対するCORSポリシーの問題を回避
                scrollY: -window.scrollY, // スクロールされた分を考慮
                windowHeight: document.documentElement.offsetHeight // 全体の高さを指定
            }).then(function(canvas) {
                // 以前と同様のPDF生成処理
            });
            

            document.getElementById('download-pdf').addEventListener('click', function() {
                html2canvas(document.body).then(function(canvas) {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jspdf.jsPDF();
                    pdf.addImage(imgData, 'PNG', 0, 0);
                    pdf.save("download.pdf");
                });
            });
            
            document.getElementById('download-pdf').addEventListener('click', function() {
                // 確認メッセージの表示
                if (confirm("PDFを保存しますか？")) {
                    generatePDF(); // ユーザーがOKを選択した場合、PDF生成関数を呼び出す
                }
            });
            
            function generatePDF() {
                html2canvas(document.body, {scrollY: -window.scrollY}).then(function(canvas) {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF();
                    pdf.addImage(imgData, 'PNG', 0, 0);
                    pdf.save("download.pdf");
                });
            }
            


            

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

            // プログレスバーに目盛りを追加（この部分を追記）
            addProgressTicks(questions.length);
        });
}

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

function scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function updateProgressBarForAnswerRate(totalQuestions) {
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    const answerRate = (answeredQuestions / totalQuestions) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${answerRate}%`;
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