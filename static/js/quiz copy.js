function fetchQuestions() {
    fetch('/api/questions')
        .then(response => response.json())
        .then(questions => {
            const container = document.getElementById('quiz-container');
            questions.forEach((question, index) => { // indexを追加
                const questionElem = document.createElement('div');
                questionElem.setAttribute('data-question-id', question.id); // この行を追加
                questionElem.innerHTML = `<p>問題${index + 1}: ${question.question}</p>` + // 番号を表示
                    question.choices.map((choice, choiceIndex) =>
                        `<label><input type="radio" name="question${question.id}" value="${choiceIndex + 1}"> ${choice}</label>`
                    ).join('<br>');
                container.appendChild(questionElem);
            });
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
        document.getElementById('result').innerHTML = ''; // 既存の結果をクリア
        document.getElementById('result').innerHTML = `採点結果: ${data.score}点`; // 新しい結果を表示

        const totalQuestions = data.results.length; // 問題数
        let correctAnswers = data.results.filter(result => result.is_correct).length; // 正解数
        let accuracy = (correctAnswers / totalQuestions) * 100; // 正解率の計算
        document.getElementById('result').innerHTML += `<br>正解率: ${accuracy.toFixed(2)}%`;

        // 結果表示後にページの最上部へスムーズにスクロール
        scrollToTop(); // この行を追加

        // 各問題の正解/不正解の表示エリアをクリアし、新しい結果を表示
        data.results.forEach(result => {
            const questionElem = document.querySelector(`[data-question-id="${result.question_id}"]`);
            // 既存の結果表示をクリアするための追加処理
            const existingResult = questionElem.querySelector('.result');
            if (existingResult) {
                questionElem.removeChild(existingResult);
            }
            const resultElem = document.createElement('div');
            resultElem.classList.add('result'); // 再描画時にこの要素を識別できるようにクラスを追加
            if (result.is_correct) {
                resultElem.textContent = '正解';
                resultElem.style.color = 'green';
            } else {
                resultElem.textContent = '不正解';
                resultElem.style.color = 'red';
            }
            questionElem.appendChild(resultElem);
        });
    });
}

function scrollToTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function updateAnswerRate() {
    const totalQuestions = document.querySelectorAll('input[type="radio"]').length / 5; // 選択肢5つごとに1問と仮定
    const answeredQuestions = new Set([...document.querySelectorAll('input[type="radio"]:checked')].map(input => input.name)).size;
    document.getElementById('answerRate').textContent = `解答率：${answeredQuestions}/${totalQuestions} 問`;
}

function fetchQuestions() {
    fetch('/api/questions')
        .then(response => response.json())
        .then(questions => {
            const container = document.getElementById('quiz-container');
            questions.forEach((question, index) => {
                const questionElem = document.createElement('div');
                questionElem.innerHTML = `<p>問題${index + 1}: ${question.question}</p>` +
                    question.choices.map((choice, choiceIndex) =>
                        `<label><input type="radio" name="question${question.id}" value="${choiceIndex + 1}"> ${choice}</label>`
                    ).join('<br>');
                container.appendChild(questionElem);
            });

            // 解答率の更新イベントリスナーを追加
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', updateAnswerRate);
            });

            // 初期表示時に解答率を更新
            updateAnswerRate();
        });
}

// 問題表示時に、各問題のdiv要素にdata-question-id属性を追加する必要があります。

window.onload = fetchQuestions;