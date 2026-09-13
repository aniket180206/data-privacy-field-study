/* =========================================================
   DATA PRIVACY FIELD STUDY
   LEADERBOARD
   ========================================================= */

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz2qTZQR7u8eZJUb_Ac9Ytnr-9nAoItyDIP7HjS-onbHgcDcYw2XzF6onGnJEmiO4yQcg/exec";


document.addEventListener("DOMContentLoaded", function () {

  loadLeaderboard();

});


/* =========================================================
   LOAD LEADERBOARD
   ========================================================= */

function loadLeaderboard() {

  const container =
    document.getElementById("leaderboard");

  const loading =
    document.getElementById("leaderboardLoading");

  const error =
    document.getElementById("leaderboardError");


  if (loading) {
    loading.style.display = "block";
  }

  if (error) {
    error.style.display = "none";
  }


  /*
   * JSONP callback
   */

  const callbackName =
    "leaderboardCallback_" +
    Date.now();


  window[callbackName] =
    function (data) {

      try {

        if (loading) {
          loading.style.display = "none";
        }


        if (
          !data ||
          data.success === false
        ) {

          showLeaderboardError(
            "Unable to load leaderboard."
          );

          return;
        }


        /*
         * Support both:
         *
         * data.leaderboard
         * data.rows
         */

        const players =
          Array.isArray(data.leaderboard)
            ? data.leaderboard
            : (
                Array.isArray(data.rows)
                  ? data.rows
                  : []
              );


        renderLeaderboard(
          players
        );

      }

      catch (err) {

        console.error(
          "Leaderboard render error:",
          err
        );

        showLeaderboardError(
          "Unable to display leaderboard."
        );
      }


      cleanupJSONP(
        callbackName,
        script
      );
    };


  const script =
    document.createElement("script");


  script.src =
    BACKEND_URL +
    "?action=leaderboard" +
    "&callback=" +
    encodeURIComponent(callbackName) +
    "&t=" +
    Date.now();


  script.async = true;


  script.onerror =
    function () {

      if (loading) {
        loading.style.display = "none";
      }

      showLeaderboardError(
        "Could not connect to the leaderboard server."
      );


      cleanupJSONP(
        callbackName,
        script
      );
    };


  document.body.appendChild(
    script
  );


  /*
   * Timeout
   */

  setTimeout(
    function () {

      if (
        window[callbackName]
      ) {

        showLeaderboardError(
          "Leaderboard request timed out."
        );

        cleanupJSONP(
          callbackName,
          script
        );
      }

    },
    15000
  );
}


/* =========================================================
   RENDER LEADERBOARD
   ========================================================= */

function renderLeaderboard(
  players
) {

  const container =
    document.getElementById(
      "leaderboard"
    );


  if (!container) {
    return;
  }


  if (
    !players ||
    players.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>No quiz attempts yet</h3>
        <p>Complete the quiz to appear on the leaderboard.</p>
      </div>
    `;

    return;
  }


  /*
   * Sort again on client side.
   */

  players.sort(
    function (a, b) {

      const scoreA =
        Number(a.score) || 0;

      const scoreB =
        Number(b.score) || 0;


      if (
        scoreB !== scoreA
      ) {

        return scoreB - scoreA;
      }


      const timeA =
        Number(a.time) || 999999;

      const timeB =
        Number(b.time) || 999999;


      return timeA - timeB;
    }
  );


  let html = "";


  players.forEach(
    function (player, index) {

      const rank =
        index + 1;


      const name =
        escapeHTML(
          player.name ||
          "Anonymous"
        );


      const score =
        Number(player.score) || 0;


      const total =
        Number(player.total) || 10;


      const percentage =
        player.percentage !== undefined
          ? Number(player.percentage)
          : Math.round(
              (score / total) * 100
            );


      const time =
        Number(player.time) || 0;


      let medal = "";


      if (rank === 1) {
        medal = "🥇";
      }

      else if (rank === 2) {
        medal = "🥈";
      }

      else if (rank === 3) {
        medal = "🥉";
      }

      else {
        medal = rank;
      }


      html += `

        <div class="leaderboard-row">

          <div class="leaderboard-rank">
            ${medal}
          </div>

          <div class="leaderboard-name">
            ${name}
          </div>

          <div class="leaderboard-score">
            ${score}/${total}
          </div>

          <div class="leaderboard-percentage">
            ${percentage}%
          </div>

          <div class="leaderboard-time">
            ${formatTime(time)}
          </div>

        </div>

      `;
    }
  );


  container.innerHTML =
    html;
}


/* =========================================================
   ERROR
   ========================================================= */

function showLeaderboardError(
  message
) {

  const container =
    document.getElementById(
      "leaderboard"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div class="empty-state">

      <div class="empty-icon">
        ⚠️
      </div>

      <h3>
        Leaderboard unavailable
      </h3>

      <p>
        ${escapeHTML(message)}
      </p>

      <button
        onclick="loadLeaderboard()"
        class="btn"
      >
        Try Again
      </button>

    </div>

  `;
}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
  seconds
) {

  seconds =
    Number(seconds) || 0;


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remaining =
    Math.floor(
      seconds % 60
    );


  if (minutes > 0) {

    return (
      minutes +
      "m " +
      String(remaining).padStart(2, "0") +
      "s"
    );
  }


  return (
    remaining +
    "s"
  );
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
  value
) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}


/* =========================================================
   JSONP CLEANUP
   ========================================================= */

function cleanupJSONP(
  callbackName,
  script
) {

  try {

    delete window[
      callbackName
    ];

  }

  catch (e) {

    window[
      callbackName
    ] = undefined;
  }


  if (
    script &&
    script.parentNode
  ) {

    script.parentNode.removeChild(
      script
    );
  }
}
