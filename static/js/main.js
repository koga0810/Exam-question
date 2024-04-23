document.addEventListener('DOMContentLoaded', function() {
    const currentDateElement = document.getElementById('current-date');
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'};
    const today = new Date().toLocaleDateString('ja-JP', options);
    currentDateElement.textContent = ` ${today} `;

    // 「開始」ボタンのクリックイベントを修正
    document.getElementById('start-question').addEventListener('click', function() {
        const studentId = document.getElementById('studentId').value;
        // 学生番号の検証（7桁の数字であること）
        if (!studentId.match(/^\d{7}$/)) {
            alert('学生番号を7桁の数字で入力してください。');
        } else {
            showCustomConfirm(); // 入力が適切な場合のみ確認ダイアログを表示
        }
    });
});

function showCustomConfirm() {
    document.getElementById('customConfirm').style.display = 'block';
}

document.getElementById('confirmOk').addEventListener('click', function() {
    document.getElementById('customConfirm').style.display = 'none';
    startExam(); // OKボタンがクリックされた時に実行
});

document.getElementById('confirmCancel').addEventListener('click', function() {
    document.getElementById('customConfirm').style.display = 'none';
});

function startExam() {
    const studentId = document.getElementById('studentId').value;
    localStorage.setItem('studentId', studentId);
    window.location.href = '/questions';
}
