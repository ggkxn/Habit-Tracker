
document.addEventListener('DOMContentLoaded', () => {
    const addHabitForm = document.getElementById('add-habit-form');
    const habitNameInput = document.getElementById('habit-name');
    const habitDescriptionInput = document.getElementById('habit-description');
    const habitListContainer = document.getElementById('habit-list');
    const noHabitsMessage = document.getElementById('no-habits-message');
    const loadingMessage = document.getElementById('loading-message');

    const getTodayDateString = () => new Date().toISOString().split('T')[0];


    function createHabitCard(habit) {
        const habitCard = document.createElement('div');
        habitCard.classList.add('habit-card');
        habitCard.dataset.id = habit.id;

        const today = getTodayDateString();
        const isCompletedToday = habit.completedDates.includes(today);

        const statusClass = isCompletedToday ? 'completed' : 'pending';
        const statusText = isCompletedToday ? 'Выполнено сегодня 🎉' : 'Не выполнено сегодня ⏳';

        habitCard.innerHTML = `
            <h3>${habit.name}</h3>
            <p>${habit.description || 'Нет описания'}</p>
            <div class="habit-status ${statusClass}">${statusText}</div>
            <div class="habit-actions">
                ${!isCompletedToday 
                    ? `<button class="btn btn-success complete-habit-btn" data-id="${habit.id}">
                        <i class="fas fa-check"></i> Отметить
                       </button>` 
                    : ''}
                <button class="btn btn-danger delete-habit-btn" data-id="${habit.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        return habitCard;
    }

    function renderHabits(habits) {
        habitListContainer.innerHTML = '';
        loadingMessage.classList.add('hidden');

        if (habits.length === 0) {
            noHabitsMessage.classList.remove('hidden');
        } else {
            noHabitsMessage.classList.add('hidden');
            habits.forEach(habit => {
                habitListContainer.appendChild(createHabitCard(habit));
            });
        }
    }

    async function fetchHabits() {
        loadingMessage.classList.remove('hidden');
        try {
            const response = await fetch('/api/habits');
            if (!response.ok) throw new Error('Не удалось загрузить данные');
            const habits = await response.json();
            renderHabits(habits);
        } catch (error) {
            console.error('Ошибка при получении привычек:', error);
            loadingMessage.textContent = 'Ошибка загрузки. Проверьте сервер Node.js.';
        }
    }

    addHabitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = habitNameInput.value.trim();
        const description = habitDescriptionInput.value.trim();

        if (!name) return alert('Название привычки не может быть пустым!');

        try {
            const response = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description })
            });
            
            if (response.ok) {
                habitNameInput.value = '';
                habitDescriptionInput.value = '';
                await fetchHabits(); 
            } else {
                alert('Ошибка при добавлении привычки.');
            }
        } catch (error) {
            console.error('Ошибка POST запроса:', error);
            alert('Произошла ошибка сети.');
        }
    });


    habitListContainer.addEventListener('click', async (e) => {

        const target = e.target.closest('button');
        if (!target) return;
        
        const habitId = target.dataset.id;
        if (!habitId) return;

        if (target.classList.contains('delete-habit-btn')) {
            if (!confirm('Вы уверены, что хотите удалить эту привычку?')) return;
            try {
                const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
                if (response.ok) {
                    await fetchHabits();
                } else {
                    alert('Ошибка при удалении.');
                }
            } catch (error) {
                console.error('Ошибка DELETE запроса:', error);
            }
        }

        if (target.classList.contains('complete-habit-btn')) {
            try {
                const response = await fetch(`/api/habits/${habitId}/complete`, { method: 'POST' });
                if (response.ok) {
                    await fetchHabits();
                } else {
                    alert('Ошибка при отметке выполнения.');
                }
            } catch (error) {
                console.error('Ошибка POST /complete запроса:', error);
            }
        }
    });

    fetchHabits();
});