document.addEventListener("DOMContentLoaded", function () {
  const EMAIL_STORAGE_KEY = "submitted_pd_email";

  let pollCount = 0;
  let currentStep = 1;

  const steps = [
    { id: 1, name: "email" },
    { id: 2, name: "brand", animatedBars: [1] },
    { id: 3, name: "product", animatedBars: [2, 3] },
    { id: 4, name: "keyword" },
    { id: 5, name: "language" },
    { id: 6, name: "tone" },
    { id: 7, name: "length", animatedBars: [4, 5] },
  ];

  // Initialize the form
  initForm();

  function initForm() {
    checkIfAlreadyGaveEmail();
    showStep(currentStep);
    addEventListeners();
  }

  function checkIfAlreadyGaveEmail() {
    if (localStorage.getItem(EMAIL_STORAGE_KEY)) {
      // find the second back-btn using querySelectorAll and remove it
      document.querySelectorAll(".back-button")[0].remove();

      currentStep++;
    }
  }

  function addEventListeners() {
    document.querySelectorAll(".next-button").forEach((button) => {
      button.addEventListener("click", nextClicked);
    });

    document.querySelectorAll(".back-button").forEach((button) => {
      button.addEventListener("click", backClicked);
    });

    document.getElementById("reset-btn").addEventListener("click", resetForm);
    document
      .getElementById("try-again-btn")
      .addEventListener("click", hideErrorState);
    document
      .getElementById("get-started-btn")
      .addEventListener("click", handleSubmitEmail);
    document
      .querySelector('input[type="submit"]')
      .addEventListener("click", handleSubmitForm);
  }

  function nextClicked() {
    if (currentStep < steps.length) {
      if (!validInput(currentStep)) return;

      currentStep++;

      // if next step has animated bars, remove them
      if (steps[currentStep - 2].animatedBars) {
        removeBars(steps[currentStep - 2].animatedBars);
      }

      showStep(currentStep);
      updateText(currentStep);
    }
  }

  function backClicked() {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  }

  function resetForm() {
    location.reload();
  }

  function showStep(step) {
    // Hide all steps
    steps.forEach((stepInfo) => {
      document.getElementById(`${stepInfo.name}-step`).style.display = "none";
    });

    document.getElementById(`${steps[step - 1].name}-step`).style.display =
      "flex";

    // Change button text for the last step
    if (step === steps.length) {
      document.querySelector(".next-button").textContent = "Submit";
    } else {
      document.querySelector(".next-button").textContent = "Next";
    }

    updateProgressBar(step);
  }

  function validInput(currentStep) {
    const inputName = steps[currentStep - 1].name;
    const errorName = `${inputName}-error`;
    const errorElement = document.getElementById(errorName);
    let input;

    if (currentStep >= 5) {
      input = document.querySelector(
        `input[name="${inputName}"]:checked`
      )?.value;
    } else {
      input = document.getElementById(inputName)?.value;
    }

    // Trim the input and check if it's empty or contains only spaces
    if (!input || input.trim() === "") {
      errorElement.style.display = "flex";
      return false;
    }

    hideErrorState();

    return true;
  }

  function updateText(currentStep) {
    if (currentStep === 3) {
      const brandName = document.getElementById("brand")?.value;
      const brandNameElements = document.querySelectorAll(".pd-brand-name");
      brandNameElements.forEach((element) => {
        element.textContent = brandName;
      });
    }

    if (currentStep === 4) {
      const productName = document.getElementById("product")?.value;
      const productNameElements = document.querySelectorAll(".pd-product-name");
      productNameElements.forEach((element) => {
        element.textContent = productName;
      });
    }
  }

  async function handleSubmitEmail(e) {
    e.preventDefault();
    const email = document.getElementById("email")?.value;

    if (!email) return;

    localStorage.setItem("submitted_pd_email", true);

    const url = "https://book.soona.co/api/eventing/subscribe";
    const payload = {
      new_lead: {
        email: email,
        lead_source: "product description generator",
      },
    };

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    showLoadingState();

    const product = document.getElementById("product")?.value;
    const keywords = document.getElementById("keyword")?.value;
    const language = document.querySelector(
      'input[name="language"]:checked'
    )?.value;
    const tone = document.querySelector('input[name="tone"]:checked')?.value;
    const length = document.querySelector(
      'input[name="length"]:checked'
    )?.value;

    const url = "https://book.soona.co/api/predictions";
    const payload = {
      generate: {
        provider: "respell",
        payload: {
          spellId: "d6W1mVyb-wpsMfrsmJed0",
          inputs: {
            product_name: product,
            keywords: keywords,
            language: language,
            tone: tone,
            length: length,
          },
        },
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Sorry, something went wrong. Please try again.");
      }

      const responseData = await response.json();

      if (responseData.provider_job_id) {
        pollStatus(responseData.provider_job_id);
      }
    } catch (error) {
      console.error(error);

      hideLoadingState();
      showErrorState();
    }
  }

  async function pollStatus(jobId) {
    const url = `https://book.soona.co/api/predictions/${jobId}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "complete" && pollCount < 10) {
        pollCount++;
        setTimeout(() => pollStatus(jobId), 3000);
      } else if (data.status === "complete" && data.outputs.description) {
        updateProductDescription(data.outputs.description);
        hideLoadingState();
        removeBars([4, 5]);
        resetPollCount();
      } else {
        throw new Error("Sorry, something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);

      hideLoadingState();
      showErrorState();
      resetPollCount();
    }
  }

  function updateProductDescription(description) {
    const descriptionElements = document.querySelectorAll(".pd-description");
    if (descriptionElements) {
      descriptionElements.forEach((element) => {
        element.textContent = description;
      });
    } else {
      console.error('Element with ID "product-description" not found');
    }
  }

  function updateProgressBar(currentStep) {
    const progressBar = document.querySelector(
      ".f-progress-wrapper-copy-element"
    );

    const children = progressBar.children;
    const childrenArray = Array.from(children);
    const childrenBefore = childrenArray.slice(0, currentStep - 1);
    const childrenAfter = childrenArray.slice(currentStep);

    childrenBefore.forEach((child) => {
      child.classList.add("current");
    });

    childrenAfter.forEach((child) => {
      child.classList.remove("current");
    });

    const currentStepElement = childrenArray[currentStep - 1];
    currentStepElement.classList.add("current");
  }

  function removeBars(barNumbers) {
    barNumbers.forEach((barNumber) => {
      const bars = document.querySelectorAll(`.pd-bar._${barNumber}`);
      if (bars) {
        bars.forEach((bar) => {
          bar.style.transform = "translate3d(-100%, 0px, 0px)"; // This will now animate smoothly
        });
      }
    });
  }

  function resetPollCount() {
    pollCount = 0;
  }

  function showLoadingState() {
    const loadingElement = document.getElementById("loading-state");
    loadingElement.style.display = "flex";
  }

  function hideLoadingState() {
    const loadingElement = document.getElementById("loading-state");
    loadingElement.style.display = "none";
  }

  function showErrorState() {
    const errorElement = document.getElementById("error-state");
    errorElement.style.display = "flex";
  }

  function hideErrorState() {
    const errorElement = document.getElementById("error-state");
    errorElement.style.display = "none";
  }
});
