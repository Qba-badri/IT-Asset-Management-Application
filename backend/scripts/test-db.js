const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'Banap@5692',
    database: 'IT Asset Management',
});

client.connect()
    .then(() => {
        console.log('✅ Connected to database successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });
