/* =========================================================
   DATA PRIVACY FIELD STUDY - SURVEY
   Google Apps Script Connected Version
   ========================================================= */

const SURVEY_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbz2qTZQR7u8eZJUb_Ac9Ytnr-9nAoItyDIP7HjS-onbHgcDcYw2XzF6onGnJEmiO4yQcg/exec";

const form = document.getElementById("privacySurvey");
const statusBox = document.getElementById("surveyStatus");
const submitButton = document.getElementById("submitSurvey");


/* =========================================================
   DISPLAY CORRECT OPTION TEXT
   =========================================================
   This automatically fixes any old {o} placeholders.
   ========================================================= */

function fixOptionLabels() {

  const optionLabels =
    document.querySelectorAll(".option");

  optionLabels.forEach(function(label) {

    const input = label.querySelector("input");
    const span = label.querySelector("span");

    if (!input || !span) return;

    if (
      span.textContent.trim() === "{o}" ||
      span.textContent.trim() === ""
    ) {

      span.textContent =
        getDisplayText(input.name, input.value);
    }

  });
}


/* =========================================================
   HUMAN-FRIENDLY OPTION LABELS
   ========================================================= */

function getDisplayText(question, value) {

  const displayMap = {

    /* Q2 */
    "Male": "Male",
    "Female": "Female",
    "Prefer not to say": "Prefer not to say",
    "Other": "Other",

    /* Q6 / Q12 / Q18 / Q19 */
    "Yes": "Yes",
    "No": "No",
    "Not sure": "Not sure",

    /* Q9 */
    "Name": "Name",
    "Phone": "Phone number",
    "Email": "Email address",
    "Home address": "Home address",
    "Aadhaar/PAN": "Aadhaar / PAN details",
    "Photos": "Photos",
    "All of the above": "All of the above",

    /* Q14 */
    "Some accounts private": "Some accounts are private",
    "I don’t know how": "I don't know how to change privacy settings",

    /* Q16 */
    "Yes, on most accounts": "Yes, on most accounts",
    "Yes, on some accounts": "Yes, on some accounts",
    "Don’t know what 2FA is": "I don't know what 2FA is",

    /* Q17 */
    "Sometimes": "Sometimes",

    /* Q20 */
    "UPI/Payment Fraud": "UPI / Payment Fraud",
    "OTP Scam": "OTP Scam",
    "Phishing": "Phishing",
    "Fake Shopping Website": "Fake Shopping Website",
    "Social Media Hacking": "Social Media Account Hacking",
    "Identity Theft": "Identity Theft",
    "Fake Job/Internship Scam": "Fake Job/Internship Scam",
    "Online Gaming/Investment Scam": "Online Gaming / Investment Scam",
    "Cyberbullying": "Cyberbullying",
    "Not applicable": "Not applicable",

    /* Q25 */
    "College awareness programs": "College awareness programs",
    "Workshops": "Workshops / seminars",
    "Social media campaigns": "Social media awareness campaigns",
    "Cybersecurity training": "Cybersecurity training",
    "Government campaigns": "Government awareness campaigns",
    "Videos": "Educational videos",
    "Online courses": "Online courses",
    "More information from banks/payment apps":
      "More information from banks / payment apps"
  };

  return displayMap[value] || value;
}


/* =========================================================
   COLLECT FORM ANSWERS
   ========================================================= */

function collectAnswers() {

  const answers = {};

  for (let i = 1; i <= 25; i++) {

    const name = "q" + i;

    const checkboxes =
      document.querySelectorAll(
        `input[name="${name}"][type="checkbox"]:checked`
      );

    const radio =
      document.querySelector(
        `input[name="${name}"][type="radio"]:checked`
      );

    const field =
      document.querySelector(
        `[name="${name}"]`
      );


    /* Checkbox question */

    if (checkboxes.length > 0) {

      answers[name] =
        Array.from(checkboxes)
          .map(function(input) {
            return input.value;
          });

      continue;
    }


    /* Checkbox question with nothing selected */

    const hasCheckbox =
      document.querySelector(
        `input[name="${name}"][type="checkbox"]`
      );

    if (hasCheckbox) {

      answers[name] = [];

      continue;
    }


    /* Radio question */

    if (radio) {

      answers[name] = radio.value;

      continue;
    }


    /* Radio question with nothing selected */

    const hasRadio =
      document.querySelector(
        `input[name="${name}"][type="radio"]`
      );

    if (hasRadio) {

      answers[name] = "";

      continue;
    }


    /* Select / input */

    answers[name] =
      field ? field.value : "";
  }

  return answers;
}


/* =========================================================
   VALIDATE CHECKBOX QUESTIONS
   ========================================================= */

function validateCheckboxes() {

  const checkboxQuestions = [9, 20, 25];

  for (const number of checkboxQuestions) {

    const selected =
      document.querySelectorAll(
        `input[name="q${number}"]:checked`
      );

    if (selected.length === 0) {

      showStatus(
        "Please answer Question " +
        number +
        " before submitting.",
        "error"
      );

      const first =
        document.querySelector(
          `input[name="q${number}"]`
        );

      if (first) {
        first.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      return false;
    }
  }

  return true;
}


/* =========================================================
   STATUS MESSAGE
   ========================================================= */

function showStatus(message, type) {

  statusBox.hidden = false;

  statusBox.className =
    "notice " + type;

  statusBox.textContent = message;

  statusBox.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


/* =========================================================
   SUBMIT SURVEY
   ========================================================= */

form.addEventListener("submit", async function(event) {

  event.preventDefault();


  /* Browser validation */

  if (!form.reportValidity()) {
    return;
  }


  /* Honeypot */

  const honeypot =
    document.getElementById("website");

  if (honeypot && honeypot.value.trim() !== "") {
    return;
  }


  /* Checkbox validation */

  if (!validateCheckboxes()) {
    return;
  }


  /* Collect answers */

  const answers =
    collectAnswers();


  /* Disable button */

  submitButton.disabled = true;

  submitButton.textContent =
    "Submitting...";


  showStatus(
    "Submitting your response...",
    "success"
  );


  try {

    /*
     * IMPORTANT:
     *
     * We use URL-encoded POST instead of JSON
     * because this works correctly with the
     * Apps Script Web App from GitHub Pages.
     */

    const body =
      new URLSearchParams();

    body.append(
      "payload",
      JSON.stringify({
        answers: answers,
        source: window.location.href,
        submittedAt:
          new Date().toISOString()
      })
    );


    await fetch(
      SURVEY_ENDPOINT,
      {
        method: "POST",

        mode: "no-cors",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded;charset=UTF-8"
        },

        body: body.toString()
      }
    );


    /*
     * no-cors returns an opaque response.
     * If fetch itself did not throw, the request
     * reached the Apps Script endpoint.
     */

    form.reset();


    showStatus(
      "✓ Thank you! Your survey response has been submitted successfully.",
      "success"
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });


  } catch (error) {

    console.error(
      "Survey submission error:",
      error
    );


    showStatus(
      "✕ Submission failed. Please check your internet connection and try again.",
      "error"
    );

  } finally {

    submitButton.disabled = false;

    submitButton.textContent =
      "Submit Survey →";
  }

});


/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    fixOptionLabels();

  }
);
