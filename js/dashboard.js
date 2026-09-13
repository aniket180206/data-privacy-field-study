/* =========================================================
   DATA PRIVACY FIELD STUDY
   DASHBOARD
   ========================================================= */

const DASHBOARD_BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz2qTZQR7u8eZJUb_Ac9Ytnr-9nAoItyDIP7HjS-onbHgcDcYw2XzF6onGnJEmiO4yQcg/exec";


document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadDashboard();

  }
);


/* =========================================================
   LOAD DATA
   ========================================================= */

function loadDashboard() {

  const callbackName =
    "dashboardCallback_" +
    Date.now();


  window[callbackName] =
    function (data) {

      try {

        if (
          !data ||
          data.success === false
        ) {

          showDashboardError(
            "Unable to load dashboard data."
          );

          return;
        }


        const players =
          Array.isArray(data.leaderboard)
            ? data.leaderboard
            : (
                Array.isArray(data.rows)
                  ? data.rows
                  : []
              );


        buildDashboard(
          players
        );

      }

      catch (error) {

        console.error(
          "Dashboard error:",
          error
        );

        showDashboardError(
          "Dashboard could not be loaded."
        );
      }


      cleanupDashboardJSONP(
        callbackName,
        script
      );
    };


  const script =
    document.createElement(
      "script"
    );


  script.src =
    DASHBOARD_BACKEND_URL +
    "?action=leaderboard" +
    "&callback=" +
    encodeURIComponent(
      callbackName
    ) +
    "&t=" +
    Date.now();


  script.async = true;


  script.onerror =
    function () {

      showDashboardError(
        "Could not connect to dashboard server."
      );


      cleanupDashboardJSONP(
        callbackName,
        script
      );
    };


  document.body.appendChild(
    script
  );


  setTimeout(
    function () {

      if (
        window[callbackName]
      ) {

        showDashboardError(
          "Dashboard request timed out."
        );


        cleanupDashboardJSONP(
          callbackName,
          script
        );
      }

    },
    15000
  );
}


/* =========================================================
   BUILD DASHBOARD
   ========================================================= */

function buildDashboard(
  players
) {

  /*
   * No participants.
   */

  if (
    !players ||
    players.length === 0
  ) {

    updateElement(
      "totalParticipants",
      "0"
    );

    updateElement(
      "averageScore",
      "0%"
    );

    updateElement(
      "highestScore",
      "0%"
    );

    updateElement(
      "averageTime",
      "0s"
    );

    showEmptyDashboard();

    return;
  }


  const scores =
    players.map(
      function (p) {

        return Number(
          p.percentage !== undefined
            ? p.percentage
            : (
                (Number(p.score) || 0) /
                (Number(p.total) || 10) *
                100
              )
        ) || 0;

      }
    );


  const times =
    players.map(
      function (p) {

        return Number(
          p.time
        ) || 0;

      }
    );


  const totalParticipants =
    players.length;


  const averageScore =
    Math.round(
      scores.reduce(
        function (sum, value) {
          return sum + value;
        },
        0
      ) /
      scores.length
    );


  const highestScore =
    Math.max(
      ...scores
    );


  const averageTime =
    Math.round(
      times.reduce(
        function (sum, value) {
          return sum + value;
        },
        0
      ) /
      times.length
    );


  /*
   * Update cards.
   */

  updateElement(
    "totalParticipants",
    totalParticipants
  );


  updateElement(
    "averageScore",
    averageScore + "%"
  );


  updateElement(
    "highestScore",
    Math.round(
      highestScore
    ) + "%"
  );


  updateElement(
    "averageTime",
    formatDashboardTime(
      averageTime
    )
  );


  /*
   * Score distribution.
   */

  buildScoreDistribution(
    scores
  );


  /*
   * Performance categories.
   */

  buildPerformanceDistribution(
    scores
  );


  /*
   * Top performers.
   */

  buildTopPerformers(
    players
  );
}


/* =========================================================
   SCORE DISTRIBUTION
   ========================================================= */

function buildScoreDistribution(
  scores
) {

  const ranges = {

    "0–20%": 0,

    "21–40%": 0,

    "41–60%": 0,

    "61–80%": 0,

    "81–100%": 0

  };


  scores.forEach(
    function (score) {

      if (score <= 20) {

        ranges["0–20%"]++;

      }

      else if (score <= 40) {

        ranges["21–40%"]++;

      }

      else if (score <= 60) {

        ranges["41–60%"]++;

      }

      else if (score <= 80) {

        ranges["61–80%"]++;

      }

      else {

        ranges["81–100%"]++;

      }

    }
  );


  const container =
    document.getElementById(
      "scoreDistribution"
    );


  if (!container) {
    return;
  }


  const max =
    Math.max(
      ...Object.values(
        ranges
      ),
      1
    );


  let html = "";


  Object.keys(
    ranges
  ).forEach(
    function (label) {

      const count =
        ranges[label];


      const width =
        Math.round(
          (count / max) * 100
        );


      html += `

        <div class="distribution-row">

          <div class="distribution-label">
            ${label}
          </div>

          <div class="distribution-bar">

            <div
              class="distribution-fill"
              style="width:${width}%"
            ></div>

          </div>

          <div class="distribution-count">
            ${count}
          </div>

        </div>

      `;
    }
  );


  container.innerHTML =
    html;
}


/* =========================================================
   PERFORMANCE DISTRIBUTION
   ========================================================= */

function buildPerformanceDistribution(
  scores
) {

  const categories = {

    "Excellent": 0,

    "Good": 0,

    "Average": 0,

    "Needs Improvement": 0

  };


  scores.forEach(
    function (score) {

      if (score >= 80) {

        categories.Excellent++;

      }

      else if (score >= 60) {

        categories.Good++;

      }

      else if (score >= 40) {

        categories.Average++;

      }

      else {

        categories[
          "Needs Improvement"
        ]++;

      }

    }
  );


  const container =
    document.getElementById(
      "performanceDistribution"
    );


  if (!container) {
    return;
  }


  let html = "";


  Object.keys(
    categories
  ).forEach(
    function (category) {

      html += `

        <div class="performance-item">

          <span>
            ${category}
          </span>

          <strong>
            ${categories[category]}
          </strong>

        </div>

      `;

    }
  );


  container.innerHTML =
    html;
}


/* =========================================================
   TOP PERFORMERS
   ========================================================= */

function buildTopPerformers(
  players
) {

  const container =
    document.getElementById(
      "topPerformers"
    );


  if (!container) {
    return;
  }


  const sorted =
    [...players].sort(
      function (a, b) {

        const scoreA =
          Number(a.score) || 0;

        const scoreB =
          Number(b.score) || 0;


        if (
          scoreA !== scoreB
        ) {

          return scoreB - scoreA;
        }


        return (
          (Number(a.time) || 999999) -
          (Number(b.time) || 999999)
        );

      }
    );


  const top =
    sorted.slice(
      0,
      5
    );


  let html = "";


  top.forEach(
    function (player, index) {

      const percentage =
        Number(
          player.percentage
        ) || 0;


      html += `

        <div class="top-performer">

          <div class="performer-rank">
            #${index + 1}
          </div>

          <div class="performer-name">
            ${escapeDashboardHTML(
              player.name ||
              "Anonymous"
            )}
          </div>

          <div class="performer-score">
            ${percentage}%
          </div>

        </div>

      `;
    }
  );


  container.innerHTML =
    html;
}


/* =========================================================
   EMPTY DASHBOARD
   ========================================================= */

function showEmptyDashboard() {

  const ids = [

    "scoreDistribution",

    "performanceDistribution",

    "topPerformers"

  ];


  ids.forEach(
    function (id) {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.innerHTML = `
          <div class="empty-state">
            No quiz data available yet.
          </div>
        `;
      }

    }
  );
}


/* =========================================================
   ERROR
   ========================================================= */

function showDashboardError(
  message
) {

  console.error(
    message
  );


  const container =
    document.getElementById(
      "dashboardError"
    );


  if (container) {

    container.textContent =
      message;

    container.style.display =
      "block";
  }
}


/* =========================================================
   UPDATE ELEMENT
   ========================================================= */

function updateElement(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (element) {

    element.textContent =
      value;
  }
}


/* =========================================================
   TIME
   ========================================================= */

function formatDashboardTime(
  seconds
) {

  seconds =
    Number(seconds) || 0;


  if (
    seconds < 60
  ) {

    return (
      Math.round(seconds) +
      "s"
    );
  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remaining =
    Math.round(
      seconds % 60
    );


  return (
    minutes +
    "m " +
    String(
      remaining
    ).padStart(2, "0") +
    "s"
  );
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeDashboardHTML(
  value
) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}


/* =========================================================
   CLEANUP
   ========================================================= */

function cleanupDashboardJSONP(
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
