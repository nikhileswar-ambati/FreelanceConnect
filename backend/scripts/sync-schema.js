require("dotenv").config();

const mysql = require("mysql2/promise");

const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "freelance_connect",
    multipleStatements: false,
};

const tableExists = async (conn, tableName) => {
    const [rows] = await conn.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
         LIMIT 1`,
        [tableName]
    );
    return rows.length > 0;
};

const columnExists = async (conn, tableName, columnName) => {
    const [rows] = await conn.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );
    return rows.length > 0;
};

const columnIsNullable = async (conn, tableName, columnName) => {
    const [rows] = await conn.execute(
        `SELECT IS_NULLABLE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );
    return rows[0]?.IS_NULLABLE === "YES";
};

const constraintExists = async (conn, tableName, constraintName) => {
    const [rows] = await conn.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND CONSTRAINT_NAME = ?
         LIMIT 1`,
        [tableName, constraintName]
    );
    return rows.length > 0;
};

const foreignKeyDeleteRule = async (conn, tableName, constraintName) => {
    const [rows] = await conn.execute(
        `SELECT DELETE_RULE
         FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND CONSTRAINT_NAME = ?
         LIMIT 1`,
        [tableName, constraintName]
    );
    return rows[0]?.DELETE_RULE || null;
};

const indexExists = async (conn, tableName, indexName) => {
    const [rows] = await conn.execute(
        `SELECT 1
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?
         LIMIT 1`,
        [tableName, indexName]
    );
    return rows.length > 0;
};

const run = async (conn, sql, label) => {
    await conn.query(sql);
    console.log(`OK  ${label}`);
};

const dropForeignKeyIfExists = async (conn, tableName, constraintName) => {
    if (!(await constraintExists(conn, tableName, constraintName))) return;
    await run(
        conn,
        `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``,
        `dropped ${tableName}.${constraintName}`
    );
};

const dropIndexIfExists = async (conn, tableName, indexName) => {
    if (!(await indexExists(conn, tableName, indexName))) return;
    await run(
        conn,
        `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``,
        `dropped ${tableName}.${indexName}`
    );
};

const addColumnIfMissing = async (conn, tableName, columnName, definition) => {
    if (await columnExists(conn, tableName, columnName)) return;
    await run(
        conn,
        `ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`,
        `added ${tableName}.${columnName}`
    );
};

const addUniqueIndexIfMissing = async (conn, tableName, indexName, columns) => {
    if (await indexExists(conn, tableName, indexName)) return;
    await run(
        conn,
        `ALTER TABLE \`${tableName}\` ADD UNIQUE KEY \`${indexName}\` (${columns})`,
        `added ${tableName}.${indexName}`
    );
};

const addForeignKeyIfMissing = async (
    conn,
    tableName,
    constraintName,
    columnName,
    referencedTable,
    referencedColumn,
    onDelete = "CASCADE"
) => {
    const currentDeleteRule = await foreignKeyDeleteRule(conn, tableName, constraintName);
    if (currentDeleteRule === onDelete) return;
    if (currentDeleteRule !== null) {
        await dropForeignKeyIfExists(conn, tableName, constraintName);
    }
    await run(
        conn,
        `ALTER TABLE \`${tableName}\`
         ADD CONSTRAINT \`${constraintName}\`
         FOREIGN KEY (\`${columnName}\`)
         REFERENCES \`${referencedTable}\`(\`${referencedColumn}\`)
         ON DELETE ${onDelete}`,
        `added ${tableName}.${constraintName}`
    );
};

const syncExistingSchema = async (conn) => {
    const requiredTables = [
        "location",
        "user",
        "customer",
        "freelancer_skill",
        "freelancer_profile",
        "availability",
        "booking_request",
        "booking",
        "review",
    ];

    for (const tableName of requiredTables) {
        if (!(await tableExists(conn, tableName))) {
            throw new Error(
                `Missing table '${tableName}'. Import backend/sql/schema.sql first, then rerun npm run db:sync.`
            );
        }
    }

    await addColumnIfMissing(
        conn,
        "booking_request",
        "freelancer_proposed_price",
        "`freelancer_proposed_price` DECIMAL(10,2) NULL"
    );
    await addColumnIfMissing(
        conn,
        "user",
        "is_active",
        "`is_active` TINYINT(1) NULL DEFAULT 1"
    );
    await addColumnIfMissing(
        conn,
        "freelancer_profile",
        "last_active",
        "`last_active` TIMESTAMP NULL DEFAULT NULL"
    );
    await addUniqueIndexIfMissing(
        conn,
        "availability",
        "unique_freelancer_slot",
        "`freelancer_id`, `slot_date`, `slot_hour`"
    );

    await dropForeignKeyIfExists(conn, "freelancer_profile", "freelancer_profile_ibfk_2");
    await dropForeignKeyIfExists(conn, "freelancer_profile", "fk_freelancer_availability");
    if (await columnExists(conn, "freelancer_profile", "availability_id")) {
        await run(
            conn,
            "ALTER TABLE `freelancer_profile` DROP COLUMN `availability_id`",
            "dropped freelancer_profile.availability_id"
        );
    }

    await dropForeignKeyIfExists(conn, "availability", "availability_ibfk_1");
    await dropForeignKeyIfExists(conn, "booking_request", "booking_request_ibfk_1");
    await dropForeignKeyIfExists(conn, "booking_request", "fk_freelancer");
    await dropForeignKeyIfExists(conn, "customer", "customer_ibfk_1");
    await dropForeignKeyIfExists(conn, "freelancer_profile", "freelancer_profile_ibfk_1");
    await dropForeignKeyIfExists(conn, "freelancer_profile", "freelancer_profile_ibfk_3");
    await dropForeignKeyIfExists(conn, "review", "review_ibfk_1");
    await dropForeignKeyIfExists(conn, "user", "user_ibfk_1");
    await dropForeignKeyIfExists(conn, "booking", "booking_ibfk_1");

    await addForeignKeyIfMissing(
        conn,
        "availability",
        "fk_availability_freelancer",
        "freelancer_id",
        "freelancer_profile",
        "freelancer_id"
    );
    await addForeignKeyIfMissing(conn, "customer", "fk_customer_user", "user_id", "user", "user_id");
    await addForeignKeyIfMissing(
        conn,
        "freelancer_profile",
        "fk_freelancer_user",
        "user_id",
        "user",
        "user_id"
    );
    await addForeignKeyIfMissing(
        conn,
        "freelancer_profile",
        "fk_freelancer_skill",
        "skill_id",
        "freelancer_skill",
        "skill_id",
        "RESTRICT"
    );
    await addForeignKeyIfMissing(
        conn,
        "booking_request",
        "fk_booking_customer",
        "customer_id",
        "customer",
        "customer_id"
    );
    await addForeignKeyIfMissing(
        conn,
        "booking_request",
        "fk_booking_freelancer",
        "freelancer_id",
        "freelancer_profile",
        "freelancer_id"
    );
    await addForeignKeyIfMissing(
        conn,
        "booking",
        "fk_booking_request",
        "request_id",
        "booking_request",
        "request_id"
    );
    await addForeignKeyIfMissing(
        conn,
        "booking",
        "fk_booking_freelancer_profile",
        "freelancer_id",
        "freelancer_profile",
        "freelancer_id"
    );
    await addForeignKeyIfMissing(
        conn,
        "review",
        "fk_review_booking",
        "booking_id",
        "booking",
        "booking_id"
    );
    await addForeignKeyIfMissing(
        conn,
        "review",
        "fk_review_freelancer",
        "freelancer_id",
        "freelancer_profile",
        "freelancer_id"
    );

    await dropForeignKeyIfExists(conn, "booking", "booking_ibfk_2");
    await dropForeignKeyIfExists(conn, "review", "review_ibfk_2");

    const [nullFreelancers] = await conn.execute(
        "SELECT COUNT(*) AS count FROM booking_request WHERE freelancer_id IS NULL"
    );
    if (Number(nullFreelancers[0].count) > 0) {
        console.warn("SKIP booking_request.freelancer_id NOT NULL because NULL rows exist");
    } else if (await columnIsNullable(conn, "booking_request", "freelancer_id")) {
        await run(
            conn,
            "ALTER TABLE `booking_request` MODIFY `freelancer_id` INT NOT NULL",
            "made booking_request.freelancer_id required"
        );
    }

    await dropIndexIfExists(conn, "availability", "freelancer_id");
    await dropIndexIfExists(conn, "user", "email_2");
};

(async () => {
    const conn = await mysql.createConnection(connectionConfig);
    try {
        await syncExistingSchema(conn);
        console.log("Schema is aligned with the backend code.");
    } finally {
        await conn.end();
    }
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
