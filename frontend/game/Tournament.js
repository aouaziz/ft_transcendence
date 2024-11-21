const player1Username = document.getElementById("player1Username");
const player2Username = document.getElementById("player2Username");
const player3Username = document.getElementById("player3Username");
const btn = document.getElementById("btn");
const errorSpan = document.getElementById("error");

async function validatePlayerNames() {  // Make the function async
  const player1Name = player1Username.value;
  const player2Name = player2Username.value;
  const player3Name = player3Username.value;
  if (!player1Name || !player2Name || !player3Name) {
    errorSpan.textContent = "Player names cannot be empty.";
    return false;
  }
  if (player1Name === player2Name ||player2Name === player3Name || player3Name === player1Name) {
    errorSpan.textContent = "Player names cannot be the same.";
    return false;
  }

  if (!/^[a-zA-Z]+$/.test(player1Name) || !/^[a-zA-Z]+$/.test(player2Name)  || !/^[a-zA-Z]+$/.test(player3Name) ) {
    errorSpan.textContent = "Player names must contain only alphabetic characters.";
    return false;
  }
  errorSpan.textContent = "";
  localStorage.setItem("player1Name",player1Name)
  localStorage.setItem("player2Name",player2Name)
  localStorage.setItem("player3Name",player3Name)
  localStorage.setItem("TournamentGame",0)
  window.location.href = "TournamentGame.html"
}

btn.addEventListener('click', validatePlayerNames);
