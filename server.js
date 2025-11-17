
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {

        if (error.code === 'ENOENT' || error.name === 'SyntaxError') {
            await writeDB([]);
            return [];
        }
        throw error;
    }
}

async function writeDB(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/habits', async (req, res) => {
    const habits = await readDB();
    res.json(habits);
});

app.post('/api/habits', async (req, res) => {
    const habits = await readDB();
    const newHabit = {
        id: uuidv4(),
        name: req.body.name,
        description: req.body.description || '',
        createdAt: new Date().toISOString(),
        completedDates: [] 
    };

    habits.push(newHabit);
    await writeDB(habits);
    res.status(201).json(newHabit);
});

app.delete('/api/habits/:id', async (req, res) => {
    let habits = await readDB();
    const initialLength = habits.length;
    
    habits = habits.filter(h => h.id !== req.params.id);

    if (habits.length === initialLength) {
        return res.status(404).json({ message: 'Привычка не найдена' });
    }

    await writeDB(habits);
    res.json({ message: 'Привычка удалена' });
});

app.post('/api/habits/:id/complete', async (req, res) => {
    const habits = await readDB();
    const habit = habits.find(h => h.id === req.params.id);

    if (!habit) {
        return res.status(404).json({ message: 'Привычка не найдена' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    if (!habit.completedDates.includes(today)) {
        habit.completedDates.push(today);
        await writeDB(habits);
        res.json({ message: 'Отмечено', habit });
    } else {
        res.json({ message: 'Уже было отмечено сегодня', habit });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running successfully at http://localhost:${PORT}`);
});