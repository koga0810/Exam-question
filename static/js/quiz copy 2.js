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
                    updateAnswerRate(questions.length);
                });
            });

            // 初期表示時に解答率を更新
            updateAnswerRate(questions.length);
        });
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
        resultElement.innerHTML = ''; // 既存の結果をクリア
        resultElement.innerHTML = `採点結果: ${data.score}点`; // 新しい結果を表示
        const totalQuestions = data.results.length; // 問題数
        let correctAnswers = data.results.filter(result => result.is_correct).length; // 正解数
        let accuracy = (correctAnswers / totalQuestions) * 100; // 正解率の計算
        resultElement.innerHTML += `<br>正解率: ${accuracy.toFixed(2)}%`;

        // プログレスバーの更新
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = `${accuracy}%`;

        // 採点結果に応じたフィードバック
        // if (accuracy >= 80) {
        //     resultElement.innerHTML += `<br><span class="result-high">👍 素晴らしいです！</span>`;
        // } else if (accuracy >= 50) {
        //     resultElement.innerHTML += `<br><span class="result-medium">😊 良い結果です。</span>`;
        // } else {
        //     resultElement.innerHTML += `<br><span class="result-low">😣 もう少し頑張りましょう。</span>`;
        // }

        // 結果表示後にページの最上部へスムーズにスクロール
        scrollToTop();

        // ここから追加: プログレスバーの目盛りを表示
        document.querySelectorAll('.progress-mark').forEach(mark => {
            mark.style.display = "block"; // 目盛りを表示
        });

        function animateProgressBar(finalWidth) {
            const progressBar = document.getElementById('progressBar');
            let width = 0;
            const interval = setInterval(() => {
                if (width >= finalWidth) {
                    clearInterval(interval);
                } else {
                    width++;
                    progressBar.style.width = width + '%';

                    // 進捗率に応じてプログレスバーの色を変更
                    if (width <= 33) {
                        progressBar.style.backgroundColor = 'red';
                    } else if (width <= 66) {
                        progressBar.style.backgroundColor = 'yellow';
                    } else {
                        progressBar.style.backgroundColor = 'green';
                    }
                }
            }, 30); // アニメーションの速さを調整
        }

        // 各問題の正解/不正解の表示エリアをクリアし、新しい結果を表示
        data.results.forEach(result => {
            const questionElem = document.querySelector(`[data-question-id="${result.question_id}"]`);
            const existingResult = questionElem.querySelector('.result');
            if (existingResult) {
                questionElem.removeChild(existingResult);
            }
            const resultElem = document.createElement('div');
            resultElem.classList.add('result');
            if (result.is_correct) {
                resultElem.textContent = '正解';
                resultElem.style.color = 'green';
            } else {
                resultElem.textContent = '不正解';
                resultElem.style.color = 'red';
            }
            questionElem.appendChild(resultElem);
            animateProgressBar(accuracy);
        });
    });
}

function scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function updateAnswerRate(totalQuestions) {
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    document.getElementById('answerRate').textContent = `解答率：${answeredQuestions}/${totalQuestions} 問`;
}

window.onload = fetchQuestions;
