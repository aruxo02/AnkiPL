document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE CATEGORÍAS ---
    const categorias = {
        "Lección 1": {
            folder: 'Leccion1',
            files: ['vocabulario.csv', 'vervos.csv','frases.csv'], 
            materials: [
                { name: 'Clase 1', file: 'Lekcja1.pdf' },
                { name: 'Ejercicios', file: 'Lekcja1_Ejercicios.pdf' },
                { name: 'Historias para leer', file: 'Lekcja1_3_Historias.pdf' },
                { name: 'Ejercicios Soluciones', file: 'Lekcja1_Ejercicios_Soluciones.pdf' },
                { name: 'Vocabulario CSV', file: 'vocabulario.csv' },
                { name: 'Verbos CSV', file: 'vervos.csv' } ,
                { name: 'Frases CSV', file: 'frases.csv' } 
            ]
        }
    };

    // --- Selectores de Elementos ---
    const selector = document.getElementById('collection-selector');
    const cardContainer = document.getElementById('flashcard-container');
    const card = document.getElementById('card');
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const cardCounter = document.getElementById('card-counter');
    const materialsContainer = document.getElementById('materials-container');
    const navigationContainer = document.getElementById('navigation');
    const scoreContainer = document.getElementById('score-container');
    const correctScoreSpan = document.getElementById('correct-score');
    const incorrectScoreSpan = document.getElementById('incorrect-score');
    const gradingContainer = document.getElementById('grading-container');
    const correctBtn = document.getElementById('correct-btn');
    const wrongBtn = document.getElementById('wrong-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalLinks = document.getElementById('modal-links');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- Variables de Estado ---
    let currentCards = [];
    let currentIndex = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    // --- INICIALIZACIÓN ---
    const reviewOptGroup = document.createElement('optgroup');
    reviewOptGroup.label = "--- Repaso General ---";
    const reviewOption = document.createElement('option');
    reviewOption.value = "lesson1_review";
    reviewOption.textContent = "Repaso Lección 1 (Mezclado)";
    reviewOptGroup.appendChild(reviewOption);
    selector.appendChild(reviewOptGroup);

    for (const categoryName in categorias) {
        const categoryData = categorias[categoryName];
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;
        categoryData.files.forEach(fileName => {
            const option = document.createElement('option');
            option.value = `${categoryData.folder}/${fileName}`;
            option.dataset.category = categoryName;
            option.textContent = fileName.replace('.csv', '').replace(/-/g, ' ');
            optgroup.appendChild(option);
        });
        selector.appendChild(optgroup);
    }
    
    // --- LÓGICA DE CARGA DE MAZOS ---
    async function loadLesson1Review() {
        cardFront.textContent = 'Cargando repaso de Lección 1...';
        let allCards = [];
        const fetchPromises = [];
        const lesson1Data = categorias["Lección 1"];
        if (lesson1Data) {
            for (const fileName of lesson1Data.files) {
                const path = `colecciones/${lesson1Data.folder}/${fileName}`;
                fetchPromises.push(
                    fetch(path)
                        .then(response => response.ok ? response.text() : Promise.reject(`Error en ${path}`))
                        .catch(error => { console.error("Fallo al cargar un archivo:", error); return ""; })
                );
            }
            const allTexts = await Promise.all(fetchPromises);
            const combinedText = allTexts.join('\n');
            allCards = combinedText.trim().split('\n').filter(line => line && line.includes(',')).map(line => {
                const parts = line.split(',');
                return { front: parts[0], back: parts[1] };
            });
            shuffleArray(allCards);
            currentCards = allCards;
            startDeck();
        } else {
            cardFront.textContent = 'Error: No se encontró la Lección 1.';
        }
    }

    async function loadCollection(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error('No se pudo cargar el archivo.');
            const text = await response.text();
            currentCards = text.trim().split('\n').filter(line => line).map(line => {
                const parts = line.split(',');
                return { front: parts[0], back: parts[1] };
            });
            startDeck();
        } catch (error) {
            console.error('Error cargando la colección:', error);
            cardFront.textContent = 'Error al cargar el mazo.';
            cardBack.textContent = '';
        }
    }

    function startDeck() {
        currentIndex = 0;
        correctAnswers = 0;
        incorrectAnswers = 0;
        scoreContainer.classList.remove('hidden');
        updateScoreDisplay();
        displayCard();
    }

    // --- EVENTOS DE CLIC ---
    selector.addEventListener('change', async (event) => {
        const selectedOption = event.target.selectedOptions[0];
        const filePath = selectedOption.value;
        resetState();
        if (filePath === "lesson1_review") {
            await loadLesson1Review();
        } else if (filePath) {
            const categoryKey = selectedOption.dataset.category;
            const fullPath = `colecciones/${filePath}`;
            await loadCollection(fullPath);
            setupMaterialsButton(categoryKey);
        }
    });

    shuffleBtn.addEventListener('click', () => {
        if (currentCards.length > 0) {
            shuffleArray(currentCards);
            currentCards.forEach(card => {
                card.isSwapped = Math.random() < 0.5;
            });
            currentIndex = 0;
            displayCard();
        }
    });
    
    cardContainer.addEventListener('click', () => {
        if (currentCards.length > 0 && cardFront.textContent !== "¡Mazo completado!") {
            card.classList.toggle('is-flipped');
            if (card.classList.contains('is-flipped')) {
                gradingContainer.classList.remove('hidden');
                navigationContainer.classList.add('hidden');
            } else {
                gradingContainer.classList.add('hidden');
                navigationContainer.classList.remove('hidden');
            }
        }
    });

    correctBtn.addEventListener('click', () => {
        correctAnswers++;
        gradeAndProceed();
    });

    wrongBtn.addEventListener('click', () => {
        incorrectAnswers++;
        gradeAndProceed();
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < currentCards.length - 1) { currentIndex++; displayCard(); }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; displayCard(); }
    });
    
    // --- FUNCIONES DE ESTADO Y VISUALIZACIÓN ---
    function gradeAndProceed() {
        updateScoreDisplay();
        if (currentIndex < currentCards.length - 1) {
            currentIndex++;
            displayCard();
        } else {
            cardFront.textContent = "¡Mazo completado!";
            cardBack.textContent = `Resultados: ${correctAnswers} correctas, ${incorrectAnswers} incorrectas.`;
            card.classList.remove('is-flipped');
            gradingContainer.classList.add('hidden');
            navigationContainer.classList.remove('hidden');
        }
    }

    function displayCard() {
        card.classList.remove('is-flipped');
        gradingContainer.classList.add('hidden');
        navigationContainer.classList.remove('hidden');
        
        setTimeout(() => {
            const currentCard = currentCards[currentIndex];
            const frontText = currentCard.isSwapped ? currentCard.back : currentCard.front;
            const backText = currentCard.isSwapped ? currentCard.front : currentCard.back;
            cardFront.textContent = frontText;
            cardBack.textContent = backText;
            updateNavigation();
        }, 300);
    }

    function updateNavigation() {
        cardCounter.textContent = `${currentIndex + 1} / ${currentCards.length}`;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === currentCards.length - 1;
        shuffleBtn.disabled = false;
    }

    function updateScoreDisplay() {
        correctScoreSpan.textContent = `✅ ${correctAnswers}`;
        incorrectScoreSpan.textContent = `❌ ${incorrectAnswers}`;
    }

    function resetState() {
        currentCards = [];
        currentIndex = 0;
        card.classList.remove('is-flipped');
        cardFront.textContent = 'Selecciona un mazo para empezar';
        cardBack.textContent = '';
        cardCounter.textContent = '0 / 0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        shuffleBtn.disabled = true;
        materialsContainer.innerHTML = '';
        gradingContainer.classList.add('hidden');
        scoreContainer.classList.add('hidden');
        navigationContainer.classList.remove('hidden');
        hideModal();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- Lógica del Modal ---
    function setupMaterialsButton(categoryKey) {
        materialsContainer.innerHTML = '';
        const category = categorias[categoryKey];
        if (category && category.materials && category.materials.length > 0) {
            const button = document.createElement('button');
            button.textContent = `Ver Materiales de ${categoryKey}`;
            button.onclick = () => showModal(category);
            materialsContainer.appendChild(button);
        }
    }

    function showModal(category) {
        modalLinks.innerHTML = '';
        category.materials.forEach(material => {
            const link = document.createElement('a');
            link.href = `colecciones/${category.folder}/materiales/${material.file}`;
            link.textContent = material.name;
            link.setAttribute('target', '_blank');
            link.setAttribute('download', material.file);
            modalLinks.appendChild(link);
        });
        modalOverlay.classList.remove('hidden');
    }

    function hideModal() {
        if (modalOverlay) modalOverlay.classList.add('hidden');
    }
    
    modalCloseBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { hideModal(); }
    });
    
    resetState(); // Estado inicial
});
