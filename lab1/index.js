const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const azure = require('azure-storage');
require('dotenv').config();

app.use(bodyParser.json());

let students = [{ id: 1, name: 'Alex Gaita', faculty: 'AC', year: 4 }];
let id = 1;

const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const account = process.env.STORAGE_NAME;
const accountKey = process.env.STORAGE_KEY;
const tableName = "studenti";

const credential = new AzureNamedKeyCredential(account, accountKey);
const client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

app.post('/students', async (req, res) => {

    const { nume, facultate, ...restOfBody } = req.body

    const entity = {
        PartitionKey: nume,
        RowKey: facultate,
        ...restOfBody
    };

    await client.createEntity(entity);

    res.status(201).json(entity);
});

app.get('/students', async (req, res) => {
    const listResults = client.listEntities();
    let students = []

    for await (const student of listResults) {
        students.push(student)
    }
    res.status(200).json(students);
});

app.get('/students/:partitionKey/:rowKey', async (req, res) => {
    const partitionKey = req.params.partitionKey;
    const rowKey = req.params.rowKey;

    const student = await client.getEntity(partitionKey, rowKey);

    if (!student) {
        res.status(404).json({ error: 'Student not found' });
    } else {
        res.json(student);
    }
});

app.put('/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id);
    const updatedStudent = req.body;

    students = students.map((student) => {
        if (student.id === studentId) {
            return { ...student, ...updatedStudent };
        }
        return student;
    });

    res.json(updatedStudent);
});

app.delete('/students/:partitionKey/:rowKey', (req, res) => {
    const partitionKey = req.params.partitionKey;
    const rowKey = req.params.rowKey;

    client.deleteEntity(partitionKey,rowKey);

    res.json({ message: 'Student deleted successfully' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
