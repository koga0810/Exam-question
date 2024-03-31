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

            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    updateAnswerRate(questions.length); // 解答率を更新
                    updateProgressBarForAnswerRate(questions.length); // プログレスバーを更新
                });
            });

            updateAnswerRate(questions.length); // 解答率を初期表示時に更新
            updateProgressBarForAnswerRate(questions.length); // プログレスバーを初期表示時に更新
            addProgressTicks(questions.length); // プログレスバーに目盛りを追加
        });
}

function addProgressTicks(totalQuestions) {
    const progressBarContainer = document.getElementById('progressContainer');
    progressBarContainer.querySelectorAll('.progress-tick').forEach(tick => tick.remove());

    if (totalQuestions > 1) {
        for (let i = 0; i < totalQuestions; i++) {
            const tick = document.createElement('div');
            tick.classList.add('progress-tick');
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
        // 新しい結果表示エリアの作成
        const resultContainer = document.getElementById('result');
        resultContainer.innerHTML = ''; // 以前の結果をクリア

        const totalQuestions = data.results.length;
        let correctAnswers = data.results.filter(result => result.is_correct).length;
        let accuracy = (correctAnswers / totalQuestions) * 100;

        // 採点結果と正解率を表示
        const resultText = `採点結果: ${data.score}点<br>正解率: ${accuracy.toFixed(2)}%`;
        resultContainer.innerHTML = resultText;

        scrollToTop();

        // 正解率に基づいてプログレスバーをアニメーション
        animateProgressBar(accuracy);
    });
}


function scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function updateProgressBarForAnswerRate(totalQuestions) {
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    const answerRate = (answeredQuestions / totalQuestions) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${answerRate}%`; // "%" を忘れずに
}

function animateProgressBar(finalWidth) {
    const progressBar = document.getElementById('progressBar');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= finalWidth) {
            clearInterval(interval);
        } else {
            width++;
            progressBar.style.width = `${width}%`;
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

function updateAnswerRate(totalQuestions) {
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    document.getElementById('answerRate').textContent = `解答率：${answeredQuestions}/${totalQuestions} 問`;
}

window.onload = fetchQuestions;