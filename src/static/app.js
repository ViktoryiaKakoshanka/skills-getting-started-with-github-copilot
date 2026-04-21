document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? `
            <ul class="participant-list">
              ${details.participants
                .map((participant) => `<li>${escapeHtml(participant)}</li>`)
                .join("")}
            </ul>
          `
          : '<p class="participant-empty">No participants yet</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability-value">${spotsLeft}</span> spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function updateActivityCard(activityName, email) {
    const card = activitiesList.querySelector(`[data-activity-name="${CSS.escape(activityName)}"]`);
    if (!card) {
      return;
    }

    const participantList = card.querySelector(".participant-list");
    const emptyState = card.querySelector(".participant-empty");
    const availabilityValue = card.querySelector(".availability-value");

    if (participantList) {
      const alreadyInList = Array.from(participantList.querySelectorAll("li")).some(
        (entry) => entry.textContent === email
      );
      if (!alreadyInList) {
        const listItem = document.createElement("li");
        listItem.textContent = email;
        participantList.appendChild(listItem);
      }
    } else if (emptyState) {
      const list = document.createElement("ul");
      list.className = "participant-list";
      const listItem = document.createElement("li");
      listItem.textContent = email;
      list.appendChild(listItem);
      emptyState.replaceWith(list);
    }

    if (availabilityValue) {
      const currentSpots = Number.parseInt(availabilityValue.textContent, 10);
      if (!Number.isNaN(currentSpots) && currentSpots > 0) {
        availabilityValue.textContent = String(currentSpots - 1);
      }
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        updateActivityCard(activity, email);
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
