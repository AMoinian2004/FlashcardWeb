const container = document.getElementById('flashcardContainer');
const addButton = document.getElementById('addFlashcard');
const saveButton = document.getElementById('saveFlashcards');
const clearButton = document.getElementById('clearCanvas');
let currentDraggingElement = null;
const connections = [];
let startCard = null;
let endCard = null;

addButton.addEventListener('click', function() {
    const flashcard = createFlashcard('', '');
    container.appendChild(flashcard);
});

function addDraggingListeners(element) {
    element.addEventListener('mousedown', function(event) {
        currentDraggingElement = event.target.closest('.flashcard');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(event) {
    if (!currentDraggingElement) return;

    let xPosition = event.clientX - (currentDraggingElement.getBoundingClientRect().left - currentDraggingElement.offsetLeft);
    let yPosition = event.clientY - (currentDraggingElement.getBoundingClientRect().top - currentDraggingElement.offsetTop);


    xPosition = Math.max(xPosition, 0);
    yPosition = Math.max(yPosition, 0);

    currentDraggingElement.style.left = xPosition + 'px';
    currentDraggingElement.style.top = yPosition + 'px';

    connections.forEach(connection => {
        if (connection.start === currentDraggingElement || connection.end === currentDraggingElement) {
            const x1 = connection.start.offsetLeft + connection.start.offsetWidth / 2;
            const y1 = connection.start.offsetTop + connection.start.offsetHeight / 2;
            const x2 = connection.end.offsetLeft + connection.end.offsetWidth / 2;
            const y2 = connection.end.offsetTop + connection.end.offsetHeight / 2;

            connection.line.setAttribute('x1', x1);
            connection.line.setAttribute('y1', y1);
            connection.line.setAttribute('x2', x2);
            connection.line.setAttribute('y2', y2);
        }
    });
}


    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

function addConnectionListeners(element) {
    element.addEventListener('dblclick', function(event) {
        if (!startCard) {
            startCard = event.target.closest('.flashcard');
        } else {
            endCard = event.target.closest('.flashcard');
            drawConnection(startCard, endCard);
            startCard = null;
            endCard = null;
        }
    });
}

function drawConnection(card1, card2) {
    const svg = document.getElementById('connections');

    const x1 = card1.offsetLeft + card1.offsetWidth / 2;
    const y1 = card1.offsetTop + card1.offsetHeight / 2;
    const x2 = card2.offsetLeft + card2.offsetWidth / 2;
    const y2 = card2.offsetTop + card2.offsetHeight / 2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'black');

    svg.appendChild(line);

    connections.push({
        start: card1,
        end: card2,
        line: line
    });
}

saveButton.addEventListener('click', function() {
    saveFlashcards();
});

function saveFlashcards() {
    const flashcardsData = [];
    const connectionsData = [];
    const flashcards = document.querySelectorAll('.flashcard');
    
    flashcards.forEach((flashcard, index) => {
        flashcard.dataset.id = index;
        const frontText = flashcard.querySelector('.flashcard-front textarea').value;
        const backText = flashcard.querySelector('.flashcard-back textarea').value;

        flashcardsData.push({
            x: flashcard.style.left,
            y: flashcard.style.top,
            frontText: frontText,
            backText: backText,
            id: index
        });
    });

    connections.forEach(connection => {
        connectionsData.push({
            startId: connection.start.dataset.id,
            endId: connection.end.dataset.id
        });
    });

    const saveData = {
        flashcards: flashcardsData,
        connections: connectionsData
    };

    localStorage.setItem('flashcardsData', JSON.stringify(saveData));
}

window.addEventListener('DOMContentLoaded', (event) => {
    loadFlashcards();
});

function loadFlashcards() {
    const savedData = JSON.parse(localStorage.getItem('flashcardsData'));
    if (savedData) {
        const { flashcards, connections } = savedData;

        if (flashcards && flashcards.length) {
            flashcards.forEach(data => {
                const flashcard = createFlashcard(data.frontText, data.backText);
                flashcard.style.left = data.x;
                flashcard.style.top = data.y;
                flashcard.dataset.id = data.id;
                container.appendChild(flashcard);
            });
        }

        if (connections && connections.length) {
            connections.forEach(conn => {
                const startFlashcard = document.querySelector(`.flashcard[data-id='${conn.startId}']`);
                const endFlashcard = document.querySelector(`.flashcard[data-id='${conn.endId}']`);

                if (startFlashcard && endFlashcard) {
                    drawConnection(startFlashcard, endFlashcard);
                }
            });
        }
    }
}

function createFlashcard(frontText, backText) {
    const flashcard = document.createElement('div');
    flashcard.classList.add('flashcard');

    const flashcardContent = document.createElement('div');
    flashcardContent.classList.add('flashcard-content');

    const flashcardFront = document.createElement('div');
    flashcardFront.classList.add('flashcard-front');
    const textboxFront = document.createElement('textarea');
    textboxFront.value = frontText;
    flashcardFront.appendChild(textboxFront);

    const flashcardBack = document.createElement('div');
    flashcardBack.classList.add('flashcard-back');
    const textboxBack = document.createElement('textarea');
    textboxBack.value = backText;
    flashcardBack.appendChild(textboxBack);

    const flipButton = document.createElement('button');
    flipButton.innerText = 'Flip';
    flipButton.classList.add('flip-button');
    flipButton.addEventListener('click', function() {
        if (flashcardContent.style.transform === "rotateY(180deg)") {
            flashcardContent.style.transform = "rotateY(0deg)";
        } else {
            flashcardContent.style.transform = "rotateY(180deg)";
        }
    });
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.classList.add('delete-button');
    deleteButton.addEventListener('click', function() {
        for (let i = connections.length - 1; i >= 0; i--) {
            if (connections[i].start === flashcard || connections[i].end === flashcard) {
                connections[i].line.remove();
                connections.splice(i, 1);
            }
        }
        flashcard.remove();
    });

    flashcard.appendChild(deleteButton);
    flashcardContent.appendChild(flashcardFront);
    flashcardContent.appendChild(flashcardBack);
    flashcard.appendChild(flashcardContent);
    flashcard.appendChild(flipButton);

    addDraggingListeners(flashcard);
    addConnectionListeners(flashcard);

    return flashcard;
}

clearButton.addEventListener('click', function() {
    const flashcards = document.querySelectorAll('.flashcard');
    flashcards.forEach(flashcard => flashcard.remove());
    connections.forEach(connection => connection.line.remove());
    connections.length = 0;
});
