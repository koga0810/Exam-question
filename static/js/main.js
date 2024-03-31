document.addEventListener('DOMContentLoaded', function() {
    const currentDateElement = document.getElementById('current-date');
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'};
    const today = new Date().toLocaleDateString('ja-JP', options);
    currentDateElement.textContent = ` ${today} `;
});
