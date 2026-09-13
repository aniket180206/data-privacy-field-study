const BACKEND_URL =
"https://script.google.com/macros/s/AKfycbz2qTZQR7u8eZJUb_Ac9Ytnr-9nAoItyDIP7HjS-onbHgcDcYw2XzF6onGnJEmiO4yQcg/exec";

document.addEventListener("DOMContentLoaded", loadLeaderboard);

function loadLeaderboard() {

    const container =
        document.getElementById("leaderboard");

    if (!container) {
        console.error("Leaderboard container not found");
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            Loading leaderboard...
        </div>
    `;

    const callbackName =
        "privacyLeaderboard_" + Date.now();

    const script =
        document.createElement("script");

    window[callbackName] =
        function(data) {

            console.log("Leaderboard data:", data);

            if (!data || data.success !== true) {

                container.innerHTML = `
                    <div class="error-state">
                        Unable to load leaderboard.
                    </div>
                `;

                cleanup();
                return;
            }

            const players =
                Array.isArray(data.leaderboard)
                    ? data.leaderboard
                    : [];

            renderLeaderboard(players);

            cleanup();
        };


    function cleanup() {

        delete window[callbackName];

        if (script.parentNode) {
            script.parentNode.removeChild(script);
        }
    }


    script.src =
        BACKEND_URL +
        "?action=leaderboard" +
        "&callback=" +
        callbackName +
        "&_=" +
        Date.now();


    script.onerror =
        function() {

            console.error(
                "Could not connect to Apps Script"
            );

            container.innerHTML = `
                <div class="error-state">
                    Could not connect to leaderboard.
                    <br><br>
                    Please try again.
                </div>
            `;

            cleanup();
        };


    document.body.appendChild(script);
}


/* =========================================
   RENDER
   ========================================= */

function renderLeaderboard(players) {

    const container =
        document.getElementById("leaderboard");

    if (!players.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No quiz attempts yet</h3>
                <p>
                    Complete the quiz to appear
                    on the leaderboard.
                </p>
            </div>
        `;

        return;
    }


    let html = `

        <div class="leaderboard-header">

            <div>Rank</div>
            <div>Name</div>
            <div>Score</div>
            <div>Percentage</div>
            <div>Time</div>

        </div>

    `;


    players.forEach(function(player, index) {

        const rank =
            index + 1;

        const name =
            escapeHTML(
                player.name || "Anonymous"
            );

        const score =
            Number(player.score) || 0;

        const total =
            Number(player.total) || 10;

        const percentage =
            Number(player.percentage) ||
            Math.round(
                (score / total) * 100
            );

        const time =
            Number(player.time) || 0;


        let rankDisplay =
            "#" + rank;


        if (rank === 1) {
            rankDisplay = "🥇";
        }

        else if (rank === 2) {
            rankDisplay = "🥈";
        }

        else if (rank === 3) {
            rankDisplay = "🥉";
        }


        html += `

            <div class="leaderboard-row">

                <div class="rank">
                    ${rankDisplay}
                </div>

                <div class="name">
                    ${name}
                </div>

                <div class="score">
                    ${score}/${total}
                </div>

                <div class="percentage">
                    ${percentage}%
                </div>

                <div class="time">
                    ${formatTime(time)}
                </div>

            </div>

        `;
    });


    container.innerHTML = html;
}


/* =========================================
   TIME
   ========================================= */

function formatTime(seconds) {

    seconds =
        Math.max(
            0,
            Number(seconds) || 0
        );

    const minutes =
        Math.floor(seconds / 60);

    const secs =
        Math.floor(seconds % 60);


    if (minutes === 0) {
        return secs + " sec";
    }


    return (
        minutes +
        " min " +
        String(secs).padStart(2, "0") +
        " sec"
    );
}


/* =========================================
   SECURITY
   ========================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
