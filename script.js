document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE CATEGORÍAS Y MATERIALES ---
const categorias = {
    "Lección 1": {
        folder: 'Leccion1',
        files: ['vocabulario.csv', 'verbos.csv'], 
        materials: [
            { name: 'Clase 1', file: 'Lekcja1.pdf' },
            { name: 'Ejercicios', file: 'Lekcja1_Ejercicios.pdf' },
            { name: 'Ejercicios Soluciones', file: 'Lekcja1_Ejercicios_Soluciones.pdf' },
            { name: 'Vocabulario CSV', file: 'vocabulario.csv' },
            { name: 'Verbos CSV', file: 'verbos.csv' }
        ]
    }
};
   // --- Selectores de Elementos ---
    const selector = document.getElementById('collection-selector');
    const materialsContainer = document.getElementById('materials-container');
    const cardContainer = document.getElementById('flashcard-container');
    const card = document.getElementById('card');
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const cardCounter = document.getElementById('card-counter');
    
    // --- Selectores para el Modal ---
    const modalOverlay = document.getElementById('modal-overlay');
    const modalLinks = document.getElementById('modal-links');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let currentCards = [];
    let currentIndex = 0;

    // Poblar el selector con categorías y opciones
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

    // Cargar la colección y mostrar el botón de materiales
    selector.addEventListener('change', async (event) => {
        const selectedOption = event.target.selectedOptions[0];
        const filePath = selectedOption.value;
        const categoryKey = selectedOption.dataset.category;

        if (filePath && categoryKey) {
            const fullPath = `colecciones/${filePath}`;
            await loadCollection(fullPath);
            setupMaterialsButton(categoryKey); // Esta función creará el botón
        } else {
            resetState();
        }
    });

    // --- LÓGICA DEL MODAL ---
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
        modalOverlay.classList.add('hidden');
    }

    modalCloseBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            hideModal();
        }
    });

    // --- LÓGICA DE LAS TARJETAS ---
    async function loadCollection(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error('No se pudo cargar el archivo.');
            
            const text = await response.text();
            currentCards = text.trim().split('\n').filter(line => line).map(line => {
                const parts = line.split(',');
                return { front: parts[0], back: parts[1] };
            });

            currentIndex = 0;
            displayCard();
        } catch (error) {
            console.error('Error cargando la colección:', error);
            cardFront.textContent = 'Error al cargar el mazo.';
            cardBack.textContent = '';
        }
    }

    function displayCard() {
        if (currentCards.length === 0) {
            resetState();
            return;
        }
        card.classList.remove('is-flipped');
        const currentCard = currentCards[currentIndex];
        cardFront.textContent = currentCard.front;
        cardBack.textContent = currentCard.back;
        updateNavigation();
    }

    function updateNavigation() {
        cardCounter.textContent = `${currentIndex + 1} / ${currentCards.length}`;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === currentCards.length - 1;
    }

    cardContainer.addEventListener('click', () => {
        if (currentCards.length > 0) {
            card.classList.toggle('is-flipped');
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < currentCards.length - 1) {
            currentIndex++;
            displayCard();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            displayCard();
        }
    });

    function resetState() {
        currentCards = [];
        currentIndex = 0;
        card.classList.remove('is-flipped');
        cardFront.textContent = 'Selecciona un mazo para empezar';
        cardBack.textContent = '';
        cardCounter.textContent = '0 / 0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        materialsContainer.innerHTML = '';
        hideModal();
    }
    
    resetState();
});
