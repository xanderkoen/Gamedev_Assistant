let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

function sendMessageToServer() {
    const question = document.getElementById("question").value.trim();
    if (!question) return;

    const messageContainer = document.getElementById("message-container");
    const loadingDiv = document.getElementById("loader");
    const submitBtn = document.getElementById("submit-btn");
    const questionInput = document.getElementById("question");

    //disable inputs
    submitBtn.disabled = true;
    questionInput.disabled = true;
    questionInput.removeEventListener("keypress", enterEvent);

    //add user question to container
    displayMessage(question, true);

    loadingDiv.classList.remove("hidden");

    //make post request to server with user question
    fetch("http://localhost:8000/question", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: question, chatHistory: chatHistory })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            console.log(data.chatLog)
            if (question.toLowerCase().includes("cat")) {
                displayCatImage(data.content, data.filteredData, data.fact);
            } else {
                displayMessage(data.content, false);
            }

            //overwrite old history with new chat history
            localStorage.removeItem("chatHistory");
            localStorage.setItem("chatHistory", JSON.stringify(data.chatLog, null, 2));
        })
        .catch(error => { // catch error
            console.error("Error:", error);
            displayMessage("An error occurred while processing the question. Please try again later.", false);
        })
        .finally(() => { //enable all inputs after adding response to container
            submitBtn.disabled = false;
            questionInput.addEventListener("keypress", enterEvent);
            questionInput.disabled = false;
            loadingDiv.classList.add("hidden");

            questionInput.value = "";
            questionInput.select();
        });
}

// add ai (or user) answer to container
function displayMessage(data, isUser) {
    const messageContainer = document.getElementById("message-container");
    const messageDiv = document.createElement("div");
    messageDiv.textContent = data;
    messageDiv.classList.add("message");

    if (isUser) {
        messageDiv.classList.add("user-message");
    }

    messageContainer.prepend(messageDiv);
}

// add cat image to container
function displayCatImage(message, catData, catFact) {
    const messageContainer = document.getElementById("message-container");
    const messageDiv = document.createElement("div");
    messageDiv.textContent = message;
    messageDiv.classList.add("message");

    if (catData !== null) {
        const image = document.createElement("img");
        image.src = catData.url;
        image.width = catData.width;
        image.height = catData.height;
        image.classList.add("image");

        const factDiv = document.createElement("div");
        factDiv.textContent = catFact;
        factDiv.classList.add("message");

        messageContainer.prepend(messageDiv);
        messageContainer.prepend(image);
        messageContainer.prepend(factDiv);
    } else {
        messageContainer.prepend(messageDiv);
    }
}

//when enter is pressed
function enterEvent(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessageToServer();
    }
}


document.getElementById("question").addEventListener("keypress", enterEvent);