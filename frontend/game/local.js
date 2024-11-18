const player1Username = document.getElementById("player1Username");
const player2Username = document.getElementById("player2Username");
const btn = document.getElementById("btn");
const errorSpan = document.getElementById("error");

async function validatePlayerNames() {  // Make the function async
  const player1Name = player1Username.value;
  const player2Name = player2Username.value;
  if (!player1Name || !player2Name) {
    errorSpan.textContent = "Player names cannot be empty.";
    return false;
  }
  if (player1Name === player2Name) {
    errorSpan.textContent = "Player names cannot be the same.";
    return false;
  }

  if (!/^[a-zA-Z]+$/.test(player1Name) || !/^[a-zA-Z]+$/.test(player2Name)) {
    errorSpan.textContent = "Player names must contain only alphabetic characters.";
    return false;
  }
  errorSpan.textContent = "";
  
  try {
    // Send data to Django backend
    const response = await fetch("http://127.0.0.1:8000/api/create_game/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player1_name: player1Name,
        player2_name: player2Name,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Game created:", data);
      window.location.href = "/game.html"; // Redirect to game.html (you can append the game ID if needed)
    } else {
      const errorData = await response.json();
      errorSpan.textContent = `Error: ${JSON.stringify(errorData)}`;
    }
  } catch (error) {
    console.error("Error connecting to the backend:", error);
    errorSpan.textContent = "Error connecting to the backend.";
  }
}



btn.addEventListener('click', validatePlayerNames);
