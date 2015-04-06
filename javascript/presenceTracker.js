let timeLeft;
let timeOffPage = 0;

document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
        timeLeft = Date.now();
    } else {
        timeOffPage += Date.now() - timeLeft;
    }
});

export default {
    timeOffPage,
    isOnPage() {
        return !document.hidden;
    }
};