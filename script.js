document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN DE CATEGORÍAS ---
    // Define aquí tus categorías y los archivos CSV dentro de ellas.
    // La "clave" es el nombre que se mostrará en el menú (ej: "Lección 1").
    // El "valor" es un objeto que contiene:
    //    - 'folder': el nombre EXACTO de la carpeta dentro de /colecciones/
    //    - 'files': una lista de los archivos .csv de esa categoría.
    const categorias = {
        "Lección 1": {
            folder: 'Leccion1',
            files: ['vocabulario.csv']
        }
    };
    // ------------------------------------

    const selector = document.getElementById('collection-selector');
    const cardContainer = document.getElementById('flashcard-container');
    const card = document.getElementById('card');
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const cardCounter = document.getElementById('card-counter');

    let currentCards = [];
    let currentIndex = 0;

    // Poblar el selector con categorías y opciones
    for (const categoryName in categorias) {
        const categoryData = categorias[categoryName];
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoryName;

        categoryData.files.forEach(fileName => {
            const option = document.createElement('option');
            // La ruta completa se guarda en el valor de la opción
            option.value = `${categoryData.folder}/${fileName}`;
            // El texto visible es el nombre del archivo sin la extensión
            option.textContent = fileName.replace('.csv', '').replace(/-/g, ' ');
            optgroup.appendChild(option);
        });
        selector.appendChild(optgroup);
    }

    // Cargar la colección seleccionada
    selector.addEventListener('change', async (event) => {
        const filePath = event.target.value;
        if (filePath) {
            const fullPath = `colecciones/${filePath}`;
            await loadCollection(fullPath);
        } else {
            resetState();
        }
    });

    async function loadCollection(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error('No se pudo cargar el archivo.');
            
            const text = await response.text();
            // Filtramos líneas vacías que pueden estar al final del archivo
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
        if(currentCards.length > 0) {
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
    }
    
    resetState();
});
