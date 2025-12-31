document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('leetcodeBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://leetcode.com/problemset/' });
        });
    }
});
