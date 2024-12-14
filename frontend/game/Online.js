const Username = document.getElementById("Username");
const btn = document.getElementById("btn");
const errorSpan = document.getElementById("error");

function validatePlayerNames() {
  const Name = Username.value.trim(); // Trim whitespace from input

  // Check for empty input
  if (!Name) {
    showError("Please enter a valid username.");
    return false;
  }

  // Check for invalid characters
  if (!/^[a-zA-Z]+$/.test(Name)) {
    showError("Username must contain only alphabetic characters.");
    return false;
  }

  // Clear error message if validation passes
  clearError();
  api(Name);
  return true;
}

async function api(username) {
  const request = new Request("http://127.0.0.1:8000/matchmaking/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  try {
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Server response:", data);

    const room_code = data.room_code; // room_code is now available at the top level
    if (!room_code) {
      throw new Error("Room code is undefined in the response");
    }

    window.location.href = `OnlineGame.html?room_code=${encodeURIComponent(room_code)}&username=${encodeURIComponent(username)}`;
  } catch (error) {
    console.error("Error occurred:", error.message);
  }
}

function showError(message) {
  errorSpan.textContent = message;
  errorSpan.style.display = "block";
}

function clearError() {
  errorSpan.textContent = "";
  errorSpan.style.display = "none";
}

// Attach event listener to the button
btn.addEventListener("click", validatePlayerNames);
